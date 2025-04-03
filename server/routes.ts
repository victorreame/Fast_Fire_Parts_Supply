import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import './types'; // Import session types
import { 
  insertUserSchema, 
  insertBusinessSchema, 
  insertPartSchema,
  insertJobSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertCartItemSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);
  
  // Helper to get or create a guest user ID for cart functionality
  const getGuestUserId = (req: Request): number => {
    // If already authenticated, use that user ID
    if (req.session.userId) {
      return req.session.userId;
    }
    
    // For guest users in mobile interface, use ID 1 (for simplicity in demo)
    return 1;
  };

  // Auth routes
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user info in session
      req.session.userId = user.id;
      req.session.role = user.role;
      
      // Save the session explicitly to ensure it's stored
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  apiRouter.post("/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  apiRouter.get("/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Parts routes
  apiRouter.get("/parts", async (_req: Request, res: Response) => {
    try {
      const parts = await storage.getAllParts();
      res.json(parts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get parts" });
    }
  });

  apiRouter.get("/parts/popular", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const parts = await storage.getPopularParts(limit);
      res.json(parts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get popular parts" });
    }
  });

  apiRouter.get("/parts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const part = await storage.getPart(id);
      
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      res.json(part);
    } catch (error) {
      res.status(500).json({ message: "Failed to get part" });
    }
  });

  apiRouter.post("/parts", async (req: Request, res: Response) => {
    if (req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const partData = insertPartSchema.parse(req.body);
      const part = await storage.createPart(partData);
      res.status(201).json(part);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid part data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create part" });
    }
  });

  apiRouter.put("/parts/:id", async (req: Request, res: Response) => {
    if (req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const partData = insertPartSchema.partial().parse(req.body);
      const part = await storage.updatePart(id, partData);
      
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      res.json(part);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid part data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update part" });
    }
  });

  apiRouter.delete("/parts/:id", async (req: Request, res: Response) => {
    if (req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePart(id);
      
      if (!success) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      res.json({ message: "Part deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete part" });
    }
  });

  // Jobs routes
  apiRouter.get("/jobs", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let jobs = [];
      
      if (user.role === "contractor" && user.businessId) {
        jobs = await storage.getJobsByBusiness(user.businessId);
      } else if (user.role === "supplier") {
        // Suppliers can see all jobs
        const businesses = await storage.getAllBusinesses();
        jobs = await Promise.all(
          businesses.map(async business => {
            const businessJobs = await storage.getJobsByBusiness(business.id);
            return businessJobs;
          })
        );
        jobs = jobs.flat();
      }
      
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  apiRouter.post("/jobs", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "contractor" || !user.businessId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const jobData = insertJobSchema.parse(req.body);
      
      // Set business ID from the logged-in user
      jobData.businessId = user.businessId;
      
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Cart routes - mobile interface allows guest users
  apiRouter.get("/cart", async (req: Request, res: Response) => {
    try {
      // Use getGuestUserId to handle both authenticated and guest users
      const userId = getGuestUserId(req);
      
      // Set the userId in session for consistency
      if (!req.session.userId) {
        req.session.userId = userId;
      }
      
      const cartItems = await storage.getCartItems(userId);
      
      // Get part details for each cart item
      const cartWithDetails = await Promise.all(
        cartItems.map(async item => {
          const part = await storage.getPart(item.partId);
          return { ...item, part };
        })
      );
      
      res.json(cartWithDetails);
    } catch (error) {
      console.error("Error getting cart items:", error);
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });

  apiRouter.post("/cart", async (req: Request, res: Response) => {
    try {
      // Use getGuestUserId to handle both authenticated and guest users
      const userId = getGuestUserId(req);
      
      // Set the userId in session for consistency
      if (!req.session.userId) {
        req.session.userId = userId;
      }
      
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId
      });
      
      const cartItem = await storage.addCartItem(cartItemData);
      const part = await storage.getPart(cartItem.partId);
      
      res.status(201).json({ ...cartItem, part });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  apiRouter.put("/cart/:id", async (req: Request, res: Response) => {
    try {
      // Use getGuestUserId to handle both authenticated and guest users
      const userId = getGuestUserId(req);
      
      // Set the userId in session for consistency
      if (!req.session.userId) {
        req.session.userId = userId;
      }
      
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      // If quantity is 0, remove the item
      if (quantity === 0) {
        const success = await storage.removeCartItem(id);
        if (!success) {
          return res.status(404).json({ message: "Cart item not found" });
        }
        return res.json({ success: true, message: "Item removed from cart" });
      }
      
      // Otherwise update the quantity
      const cartItem = await storage.updateCartItemQuantity(id, quantity);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      const part = await storage.getPart(cartItem.partId);
      
      res.json({ ...cartItem, part });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  apiRouter.delete("/cart/:id", async (req: Request, res: Response) => {
    try {
      // Use getGuestUserId to handle both authenticated and guest users
      const userId = getGuestUserId(req);
      
      // Set the userId in session for consistency
      if (!req.session.userId) {
        req.session.userId = userId;
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.removeCartItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ success: true, message: "Cart item removed successfully" });
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  // Orders routes
  apiRouter.get("/orders", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let orders = [];
      
      if (user.role === "contractor" && user.businessId) {
        orders = await storage.getOrdersByBusiness(user.businessId);
      } else if (user.role === "supplier") {
        // Get recent orders for suppliers
        const limit = parseInt(req.query.limit as string) || 10;
        orders = await storage.getRecentOrders(limit);
      }
      
      // Get business details for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async order => {
          const business = await storage.getBusiness(order.businessId);
          const items = await storage.getOrderItems(order.id);
          
          // Get part details for each order item
          const itemsWithDetails = await Promise.all(
            items.map(async item => {
              const part = await storage.getPart(item.partId);
              return { ...item, part };
            })
          );
          
          return { ...order, business, items: itemsWithDetails };
        })
      );
      
      res.json(ordersWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  apiRouter.post("/orders", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "contractor" || !user.businessId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get user's cart items
      const cartItems = await storage.getCartItems(user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Create new order
      const order = await storage.createOrder({
        businessId: user.businessId,
        jobId: req.body.jobId || null,
        status: "new"
      });
      
      // Get business price tier
      const business = await storage.getBusiness(user.businessId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Create order items from cart items
      for (const cartItem of cartItems) {
        const part = await storage.getPart(cartItem.partId);
        
        if (!part) continue;
        
        // Determine price based on business price tier
        let price = part.priceT3; // Default to T3
        if (business.priceTier === "T1") price = part.priceT1;
        else if (business.priceTier === "T2") price = part.priceT2;
        
        await storage.createOrderItem({
          orderId: order.id,
          partId: part.id,
          quantity: cartItem.quantity,
          priceAtOrder: price
        });
      }
      
      // Clear user's cart
      await storage.clearCart(user.id);
      
      // Get order with items
      const items = await storage.getOrderItems(order.id);
      
      // Get part details for each order item
      const itemsWithDetails = await Promise.all(
        items.map(async item => {
          const part = await storage.getPart(item.partId);
          return { ...item, part };
        })
      );
      
      res.status(201).json({ ...order, business, items: itemsWithDetails });
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  apiRouter.put("/orders/:id", async (req: Request, res: Response) => {
    if (!req.session.userId || req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["new", "processing", "shipped", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const business = await storage.getBusiness(order.businessId);
      const items = await storage.getOrderItems(order.id);
      
      // Get part details for each order item
      const itemsWithDetails = await Promise.all(
        items.map(async item => {
          const part = await storage.getPart(item.partId);
          return { ...item, part };
        })
      );
      
      res.json({ ...order, business, items: itemsWithDetails });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Businesses routes (for supplier dashboard)
  apiRouter.get("/businesses", async (req: Request, res: Response) => {
    if (!req.session.userId || req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const businesses = await storage.getAllBusinesses();
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get businesses" });
    }
  });

  apiRouter.post("/businesses", async (req: Request, res: Response) => {
    if (!req.session.userId || req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const businessData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness(businessData);
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid business data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create business" });
    }
  });

  apiRouter.put("/businesses/:id", async (req: Request, res: Response) => {
    if (!req.session.userId || req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const id = parseInt(req.params.id);
      const businessData = insertBusinessSchema.partial().parse(req.body);
      const business = await storage.updateBusiness(id, businessData);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      res.json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid business data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  // Users routes (for supplier dashboard)
  apiRouter.post("/users", async (req: Request, res: Response) => {
    if (!req.session.userId || req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Stats route for supplier dashboard
  apiRouter.get("/stats", async (req: Request, res: Response) => {
    if (!req.session.userId || req.session.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const allOrders = await storage.getRecentOrders(1000); // Get all orders
      const businesses = await storage.getAllBusinesses();
      const parts = await storage.getAllParts();
      
      // Count orders by status
      const newOrders = allOrders.filter(order => order.status === "new").length;
      const processingOrders = allOrders.filter(order => order.status === "processing").length;
      
      // Count active businesses
      const activeBusinesses = businesses.length;
      
      // Count low stock items (< 10)
      const lowStockItems = parts.filter(part => part.inStock < 10).length;
      
      res.json({
        newOrders,
        pendingShipments: processingOrders,
        activeCustomers: activeBusinesses,
        lowStockItems
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
