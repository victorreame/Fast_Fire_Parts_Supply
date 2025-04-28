import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { InsertNotification, User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Check if the stored password is already hashed (contains a salt separator)
  if (stored.includes('.')) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } else {
    // For passwords in the seed data that aren't hashed yet
    return supplied === stored;
  }
}

// Role-based middleware for authorization
const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    next();
  };
};

// Middleware to ensure user is approved
const requireApproved = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Suppliers can always access (they don't need approval)
  if (req.user.role === 'supplier') {
    return next();
  }
  
  // Others need approval
  if (!req.user.isApproved) {
    return res.status(403).json({ 
      error: "Account pending approval",
      message: "Your account is waiting for approval. You'll be notified when it's approved."
    });
  }
  
  next();
};

// Create a notification 
const createUserRegistrationNotification = async (newUser: SelectUser) => {
  try {
    // Find suppliers to notify about new registration
    const suppliers = await storage.getUsersByRole('supplier');
    
    if (suppliers && suppliers.length > 0) {
      const notificationPromises = suppliers.map(supplier => {
        const notification: InsertNotification = {
          userId: supplier.id,
          title: 'New User Registration',
          message: `${newUser.firstName} ${newUser.lastName} has registered as a ${newUser.role === 'project_manager' ? 'Project Manager' : 'Tradie'} and is waiting for approval.`,
          type: 'user_registration',
          relatedId: newUser.id,
          relatedType: 'user'
        };
        
        return storage.createNotification(notification);
      });
      
      await Promise.all(notificationPromises);
    }
  } catch (error) {
    console.error('Failed to create user registration notifications:', error);
  }
};

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "my-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Register route - handles both tradie and pm registration
  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    // Set isApproved based on role
    const isSupplier = req.body.role === 'supplier';
    
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
      isApproved: isSupplier, // Auto-approve suppliers, others need approval
    });

    // Create notifications for suppliers about the new registration (if not a supplier)
    if (!isSupplier) {
      await createUserRegistrationNotification(user);
    }

    // Log in the user
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Check if the user is approved (except for suppliers who don't need approval)
    if (req.user.role !== 'supplier' && !req.user.isApproved) {
      return res.status(403).json({ 
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        isApproved: false,
        message: "Your account is pending approval."
      });
    }
    
    res.status(200).json(req.user);
  });

  // Enhanced logout route with security headers
  app.post("/api/logout", (req, res, next) => {
    // Set cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Log out the user from Passport
    req.logout((err) => {
      if (err) return next(err);
      
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Failed to completely logout" });
        }
        
        // Clear the cookie on the client side with secure attributes
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        return res.status(200).json({ 
          success: true, 
          message: "Logged out successfully",
          timestamp: new Date().getTime() // Add timestamp to prevent caching
        });
      });
    });
  });

  // Current user route with cache control headers to prevent back button issues
  app.get("/api/user", (req, res) => {
    // Set cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // User approval routes
  app.post("/api/users/:id/approve", requireRole(['supplier', 'project_manager']), async (req, res) => {
    const userId = parseInt(req.params.id);
    const userToApprove = await storage.getUser(userId);
    
    if (!userToApprove) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Only suppliers can approve project managers
    if (userToApprove.role === 'project_manager' && req.user.role !== 'supplier') {
      return res.status(403).json({ error: "Only suppliers can approve project managers" });
    }
    
    // Update user
    const updatedUser = await storage.updateUser(userId, {
      isApproved: true,
      approvedBy: req.user.id,
      approvalDate: new Date()
    });
    
    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to approve user" });
    }
    
    // Create a notification for the approved user
    await storage.createNotification({
      userId: userId,
      title: 'Account Approved',
      message: `Your account has been approved. You now have access to the system.`,
      type: 'user_approved',
      relatedId: userId,
      relatedType: 'user'
    });
    
    res.status(200).json(updatedUser);
  });
  
  // Reject user registration
  app.post("/api/users/:id/reject", requireRole(['supplier', 'project_manager']), async (req, res) => {
    const userId = parseInt(req.params.id);
    const userToReject = await storage.getUser(userId);
    
    if (!userToReject) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Only suppliers can reject project managers
    if (userToReject.role === 'project_manager' && req.user.role !== 'supplier') {
      return res.status(403).json({ error: "Only suppliers can reject project managers" });
    }
    
    // Create a notification for the rejected user
    await storage.createNotification({
      userId: userId,
      title: 'Registration Rejected',
      message: req.body.reason || 'Your registration has been rejected.',
      type: 'user_rejected',
      relatedId: userId,
      relatedType: 'user'
    });
    
    // You might want to mark the user as rejected or delete them
    // For now, we'll just send the notification
    
    res.status(200).json({ success: true });
  });
  
  // Export the middleware for use in other routes
  app.locals.requireRole = requireRole;
  app.locals.requireApproved = requireApproved;
}