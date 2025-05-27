import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "../shared/schema";
import { and, or, eq } from "drizzle-orm";
import { emailService } from "./email-service";
import { 
  AccessControl, 
  requireAuth, 
  requirePM, 
  requireApprovedTradie, 
  requireOrderPermissions,
  validateJobAccess,
  requireCompanyAccess
} from "./access-control";
import './types'; // Import session types
import favoritesRouter from "./favorites-routes";
import { 
  insertUserSchema, 
  insertBusinessSchema, 
  insertPartSchema,
  insertJobSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertCartItemSchema,
  insertJobPartSchema,
  favorites
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, hashPassword } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import tradieRouter from "./tradie-routes";
import notificationRouter from "./notification-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and session management
  setupAuth(app);

  // API routes
  const apiRouter = express.Router();
  // Use the favorites router from the separate file
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/tradie", tradieRouter);
  app.use("/api", apiRouter);

  // PM middleware to check if user is a project manager
  const isProjectManager = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!req.user || req.user.role !== 'project_manager') {
      return res.status(403).json({ message: "Not authorized. Project Manager role required." });
    }

    next();
  };

  // Project Manager routes
  const pmRouter = express.Router();
  apiRouter.use("/pm", isProjectManager, pmRouter);

  // PM Dashboard - Pending orders
  pmRouter.get("/orders/pending", async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrdersForApproval(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error getting pending orders:", error);
      res.status(500).json({ message: "Failed to get pending orders" });
    }
  });

  // PM Dashboard - Approved orders
  pmRouter.get("/orders/approved", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const orders = await storage.getApprovedOrdersByPM(req.user!.id, limit);
      res.json(orders);
    } catch (error) {
      console.error("Error getting approved orders:", error);
      res.status(500).json({ message: "Failed to get approved orders" });
    }
  });

  // Order approval action
  pmRouter.post("/orders/:id/approve", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { notes } = req.body;

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order is pending approval
      if (order.status !== 'pending_approval') {
        return res.status(400).json({ 
          message: "Invalid order status. Only orders with 'pending_approval' status can be approved." 
        });
      }

      // Approve the order
      const approvedOrder = await storage.approveOrder(orderId, req.user!.id, notes);
      res.json(approvedOrder);
    } catch (error) {
      console.error("Error approving order:", error);
      res.status(500).json({ message: "Failed to approve order" });
    }
  });

  // Order rejection action
  pmRouter.post("/orders/:id/reject", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      if (!reason || reason.trim() === '') {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order is pending approval
      if (order.status !== 'pending_approval') {
        return res.status(400).json({ 
          message: "Invalid order status. Only orders with 'pending_approval' status can be rejected." 
        });
      }

      // Reject the order
      const rejectedOrder = await storage.rejectOrder(orderId, req.user!.id, reason);
      res.json(rejectedOrder);
    } catch (error) {
      console.error("Error rejecting order:", error);
      res.status(500).json({ message: "Failed to reject order" });
    }
  });

  // Order modification action
  pmRouter.post("/orders/:id/modify", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { items, notes } = req.body;

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Modified items are required" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order is pending approval
      if (order.status !== 'pending_approval') {
        return res.status(400).json({ 
          message: "Invalid order status. Only orders with 'pending_approval' status can be modified." 
        });
      }

      // Modify the order
      const modifiedOrder = await storage.modifyOrder(orderId, req.user!.id, items, notes);
      res.json(modifiedOrder);
    } catch (error) {
      console.error("Error modifying order:", error);
      res.status(500).json({ message: "Failed to modify order" });
    }
  });

  // Get order history
  pmRouter.get("/orders/:id/history", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);

      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const history = await storage.getOrderHistory(orderId);
      res.json(history);
    } catch (error) {
      console.error("Error getting order history:", error);
      res.status(500).json({ message: "Failed to get order history" });
    }
  });

  // Middleware to check if tradie is approved
  const checkTradieApproved = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user) {
      if (req.user.role === 'tradie') {
        // Explicitly check for false to ensure we're properly checking the database value
        const isApproved = req.user.isApproved === true;
        
        console.log(`USER CHECK: Tradie ${req.user.id} (${req.user.username}) approval status: ${isApproved ? 'APPROVED' : 'NOT APPROVED'}`);
        console.log(`Database value: isApproved = ${req.user.isApproved}`);
        
        if (!isApproved) {
          console.log(`BLOCKED ACCESS: Unapproved tradie ${req.user.id} (${req.user.username}) attempted ${req.method} ${req.path}`);
          console.log(`Request details: ${JSON.stringify({
            userId: req.user.id,
            username: req.user.username,
            method: req.method,
            path: req.path,
            isApproved: req.user.isApproved,
            query: req.query,
            body: req.body
          })}`);
          
          return res.status(403).json({ 
            error: "Access restricted", 
            message: "Account pending approval. Contact your Project Manager for access."
          });
        }
      }
    }
    next();
  };

  // Helper to get or create a guest user ID for cart functionality
  const getGuestUserId = (req: Request): number => {
    // If already authenticated with passport, use that user ID
    if (req.isAuthenticated() && req.user) {
      console.log("User is authenticated, using ID:", req.user.id);
      return req.user.id;
    }

    // For guest users in mobile interface, use ID 1 (for simplicity in demo)
    console.log("Using guest user ID: 1");
    return 1;
  };

  // Auth routes are handled by setupAuth

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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
  apiRouter.get("/jobs", requireApprovedTradie, async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      const userId = req.isAuthenticated() ? req.user.id : getGuestUserId(req);
      const isAuthenticated = req.isAuthenticated();

      let jobs: any[] = [];

      // Public jobs are available to all users, authenticated or not
      const publicJobs = await storage.getPublicJobs();
      jobs = [...publicJobs];

      // If user is authenticated, add their specific jobs
      if (isAuthenticated) {
        const user = req.user;

        if (user.role === "contractor" && user.businessId) {
          // Contractors see their business's jobs
          const businessJobs = await storage.getJobsByBusiness(user.businessId);
          jobs = [...jobs, ...businessJobs];
        } else if (user.role === "supplier") {
          // Suppliers see all jobs they've created and all business jobs
          const createdJobs = await storage.getJobsByCreator(user.id);
          jobs = [...jobs, ...createdJobs];

          const businesses = await storage.getAllBusinesses();

          // Get all jobs with business details
          for (const business of businesses) {
            const businessJobs = await storage.getJobsByBusiness(business.id);

            jobs = [
              ...jobs,
              ...businessJobs.map(job => ({
                ...job,
                businessName: business.name
              }))
            ];
          }
        }
      }

      // Remove duplicates
      const uniqueJobs = Array.from(new Map(jobs.map(job => [job.id, job])).values());

      res.json(uniqueJobs);
    } catch (error) {
      console.error("Error getting jobs:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  // Get a single job by ID
  apiRouter.get("/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check authorization: only allow access to public jobs or jobs created by the user
      // or if the user is a supplier/admin
      if (!req.isAuthenticated()) {
        if (!job.isPublic) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      } else {
        const user = req.user;
        if (user.role !== 'supplier' && user.role !== 'admin' && 
            !job.isPublic && job.createdBy !== user.id) {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }

      res.json(job);
    } catch (error) {
      console.error("Error getting job:", error);
      res.status(500).json({ message: "Failed to get job" });
    }
  });

  // Get public jobs only (no authentication required)
  apiRouter.get("/jobs/public", async (_req: Request, res: Response) => {
    try {
      const publicJobs = await storage.getPublicJobs();
      res.json(publicJobs);
    } catch (error) {
      console.error("Error getting public jobs:", error);
      res.status(500).json({ message: "Failed to get public jobs" });
    }
  });

  apiRouter.post("/jobs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const jobData = insertJobSchema.parse(req.body);

      // Set the creator ID
      jobData.createdBy = user.id;

      if (user.role === "contractor") {
        // Contractors can only create jobs for their own business
        if (!user.businessId) {
          return res.status(403).json({ message: "Contractor must be associated with a business" });
        }

        // Set business ID from the logged-in user
        jobData.businessId = user.businessId;

        // Contractors cannot create public jobs (for now)
        jobData.isPublic = false;
      } else if (user.role === "supplier") {
        // Suppliers can create public jobs without associating with a business
        // If a business ID is provided, validate that it exists
        if (jobData.businessId) {
          const business = await storage.getBusiness(jobData.businessId);
          if (!business) {
            return res.status(400).json({ message: "Invalid business ID" });
          }
        }

        // Allow public jobs for suppliers (default remains false unless explicitly set)
        // No change needed as jobData.isPublic comes from the request
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // URGENT FIX: Hard block for unapproved users for all cart routes
  apiRouter.use('/cart*', (req: Request, res: Response, next: NextFunction) => {
    // Immediately log all cart access attempts regardless of authentication
    console.log(`CART ACCESS ATTEMPT: ${req.originalUrl} by ${req.isAuthenticated() ? `user ${req.user?.id} (${req.user?.username})` : 'unauthenticated user'}`);
    
    // STRICT BLOCK: Completely block cart access for ANY unapproved user (including contractors)
    if (req.isAuthenticated()) {
      console.log(`CART CHECK: User ${req.user?.id} (${req.user?.username}) role: ${req.user?.role}, approval status: ${req.user?.isApproved === true ? 'APPROVED' : 'NOT APPROVED'}`);
      
      // Block ANY user that does not have isApproved=true (tradie, contractor, etc.)
      if ((req.user?.role === 'tradie' || req.user?.role === 'contractor') && req.user?.isApproved !== true) {
        console.log(`SECURITY BLOCK: Denied cart access to unapproved user ${req.user.id} (${req.user.username}) with role ${req.user.role}`);
        return res.status(403).json({ 
          error: "Access Denied", 
          message: "Your account requires Project Manager approval before using cart functionality."
        });
      }
    }
    
    // Allow access for approved users
    next();
  });

  // Cart routes - mobile interface allows guest users except unapproved tradies
  apiRouter.get("/cart", async (req: Request, res: Response) => {
    try {
      // Use getGuestUserId to handle both authenticated and guest users
      const userId = getGuestUserId(req);

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
  apiRouter.post("/orders", requireOrderPermissions, async (req: Request, res: Response) => {
    try {
      let userId = 0;
      let businessId = 0;

      // Handle authenticated vs guest users
      if (req.isAuthenticated() && req.user) {
        // Verify user approval status for tradies - prevent order submission
        if (req.user.role === 'tradie' && !req.user.isApproved) {
          console.log(`BLOCKED ORDER: Unapproved tradie ${req.user.id} (${req.user.username}) attempted to place order`);
          console.log(`User approval status: ${req.user.isApproved === false ? 'NOT APPROVED' : 'APPROVED'}`);
          return res.status(403).json({
            message: "Access restricted",
            details: "Your account is pending approval from a Project Manager. You cannot place orders until approved."
          });
        }

        userId = req.user.id;
        businessId = req.user.businessId || 0;

        if (req.user.role !== "contractor" && businessId === 0) {
          // For non-contractors or users without businesses, we'll use a default/guest approach
          businessId = 1; // Default business for guests
        }
      } else {
        // Guest user - we'll use a default business ID
        userId = getGuestUserId(req);
        businessId = 1; // Default business for guests
      }

      // Get user's cart items
      const cartItems = await storage.getCartItems(userId);

      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Create new order
      const order = await storage.createOrder({
        businessId: businessId,
        jobId: req.body.jobId || null,
        customerName: req.body.customerName || "Guest User",
        orderNumber: req.body.orderNumber || null,
        status: "new"
      });

      // Get business price tier
      const business = await storage.getBusiness(businessId);

      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Create order items from cart items
      for (const cartItem of cartItems) {
        const part = await storage.getPart(cartItem.partId);

        if (!part) continue;

        // Determine price based on business price tier
        let price = part.price_t3; // Default to T3
        if (business.priceTier === "T1") price = part.price_t1;
        else if (business.priceTier === "T2") price = part.price_t2;

        await storage.createOrderItem({
          orderId: order.id,
          partId: part.id,
          quantity: cartItem.quantity,
          priceAtOrder: price
        });
      }

      // Clear user's cart
      await storage.clearCart(userId);

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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
  // Get user permissions
  apiRouter.get("/user/permissions", requireAuth, async (req: Request, res: Response) => {
    try {
      const permissions = await AccessControl.getUserPermissions(req.user!.id);
      res.json(permissions);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });

  apiRouter.post("/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
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
      const lowStockItems = parts.filter(part => {
        return part.in_stock === null ? true : part.in_stock < 10;
      }).length;

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

  // Configure multer for file uploads
  const uploadStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadPath = path.join(process.cwd(), 'public', 'uploads');

      // Ensure the directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  // File filter to only allow images
  const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  };

  const upload = multer({ 
    storage: uploadStorage, 
    fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit
    }
  });

  // Upload image for a part
  apiRouter.post("/parts/:id/image", upload.single('image'), async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user.role !== "supplier") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const id = parseInt(req.params.id);
      const part = await storage.getPart(id);

      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create the URL for the uploaded image
      const imagePath = `/uploads/${req.file.filename}`;

      // Update the part with the image path
      const updatedPart = await storage.updatePart(id, { image: imagePath });

      res.json(updatedPart);
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Job Parts routes
  apiRouter.get("/jobs/:jobId/parts", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Get job parts with part details
      const jobParts = await storage.getJobPartsWithDetails(jobId);

      res.json(jobParts);
    } catch (error) {
      console.error("Error getting job parts:", error);
      res.status(500).json({ message: "Failed to get job parts" });
    }
  });

  apiRouter.post("/jobs/:jobId/parts", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Validate part data
      const jobPartData = insertJobPartSchema.parse({
        ...req.body,
        jobId
      });

      // Check if part exists
      const part = await storage.getPart(jobPartData.partId);
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }

      // Add part to job
      const jobPart = await storage.addJobPart(jobPartData);

      res.status(201).json({ ...jobPart, part });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job part data", errors: error.errors });
      }
      console.error("Error adding part to job:", error);
      res.status(500).json({ message: "Failed to add part to job" });
    }
  });

  apiRouter.put("/jobs/:jobId/parts/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      if (isNaN(jobId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Update job part quantity
      const jobPart = await storage.updateJobPartQuantity(id, quantity);

      if (!jobPart) {
        return res.status(404).json({ message: "Job part not found" });
      }

      // Get part details
      const part = await storage.getPart(jobPart.partId);

      res.json({ ...jobPart, part });
    } catch (error) {
      console.error("Error updating job part:", error);
      res.status(500).json({ message: "Failed to update job part" });
    }
  });

  apiRouter.delete("/jobs/:jobId/parts/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const id = parseInt(req.params.id);

      if (isNaN(jobId) || isNaN(id)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      // Check if job exists
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Remove part from job
      const success = await storage.removeJobPart(id);

      if (!success) {
        return res.status(404).json({ message: "Job part not found" });
      }

      res.json({ success: true, message: "Part removed from job successfully" });
    } catch (error) {
      console.error("Error removing part from job:", error);
      res.status(500).json({ message: "Failed to remove part from job" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Serve static assets including part SVGs
  app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));

  // Add Job Management routes for PM

  // Get all jobs assigned to the PM
  pmRouter.get("/jobs", async (req: Request, res: Response) => {
    try {
      const pmId = req.user!.id;
      const jobs = await storage.getJobsByProjectManager(pmId);
      res.json(jobs);
    } catch (error) {
      console.error("Error getting PM jobs:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  // Get job with detailed information
  pmRouter.get("/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const jobDetails = await storage.getJobWithDetails(jobId);

      if (!jobDetails) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if the PM is assigned to this job
      if (jobDetails.projectManagerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this job" });
      }

      res.json(jobDetails);
    } catch (error) {
      console.error("Error getting job details:", error);
      res.status(500).json({ message: "Failed to get job details" });
    }
  });

  // Create a new job
  pmRouter.post("/jobs", async (req: Request, res: Response) => {
    try {
      const pmId = req.user!.id;
      const jobData = req.body;

      // Validate required fields
      if (!jobData.name || !jobData.jobNumber) {
        return res.status(400).json({ message: "Job name and number are required" });
      }

      // Create the job with the PM as the creator and assigned PM
      const newJob = await storage.createJob({
        ...jobData,
        projectManagerId: pmId,
        createdBy: pmId,
        status: jobData.status || "Not Started" 
      });

      res.status(201).json(newJob);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Update a job
  pmRouter.put("/jobs/:id", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const updateData = req.body;

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      // Get the job to check authorization
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if the PM is assigned to this job
      if (job.projectManagerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this job" });
      }

      const updatedJob = await storage.updateJob(jobId, updateData);
      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Assign a tradie to a job
  pmRouter.post("/jobs/:id/assign", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const { userId } = req.body;

      if (isNaN(jobId) || !userId) {
        return res.status(400).json({ message: "Valid job ID and user ID are required" });
      }

      // Get the job to check authorization
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if the PM is assigned to this job
      if (job.projectManagerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to manage this job" });
      }

      // Check if the user exists and is a tradie
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role !== 'tradie') {
        return res.status(400).json({ message: "Only tradies can be assigned to jobs" });
      }

      // Check if already assigned
      const existingAssignments = await storage.getJobUsersByJob(jobId);
      const alreadyAssigned = existingAssignments.some(assignment => assignment.userId === userId);

      if (alreadyAssigned) {
        return res.status(400).json({ message: "User is already assigned to this job" });
      }

      // Assign the user to the job
      const jobUser = await storage.assignUserToJob({
        jobId,
        userId,
        assignedBy: req.user!.id
      });

      res.status(201).json(jobUser);
    } catch (error) {
      console.error("Error assigning user to job:", error);
      res.status(500).json({ message: "Failed to assign user to job" });
    }
  });

  // Remove a tradie from a job
  pmRouter.delete("/jobs/:jobId/users/:assignmentId", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const assignmentId = parseInt(req.params.assignmentId);

      if (isNaN(jobId) || isNaN(assignmentId)) {
        return res.status(400).json({ message: "Invalid job ID or assignment ID" });
      }

      // Get the job to check authorization
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if the PM is assigned to this job
      if (job.projectManagerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to manage this job" });
      }

      // Check if the assignment exists
      const jobUser = await storage.getJobUser(assignmentId);

      if (!jobUser || jobUser.jobId !== jobId) {
        return res.status(404).json({ message: "Assignment not found for this job" });
      }

      await storage.removeUserFromJob(assignmentId);

      res.json({ message: "User removed from job successfully" });
    } catch (error) {
      console.error("Error removing user from job:", error);
      res.status(500).json({ message: "Failed to remove user from job" });
    }
  });

  // Get all tradies (for assignment selection)
  pmRouter.get("/tradies", async (req: Request, res: Response) => {
    try {
      const tradies = await storage.getUsersByRole('tradie');
      res.json(tradies);
    } catch (error) {
      console.error("Error getting tradies:", error);
      res.status(500).json({ message: "Failed to get tradies" });
    }
  });

  // Get pending tradies awaiting approval
  pmRouter.get("/tradies/pending", async (req: Request, res: Response) => {
    try {
      // Get users with role 'tradie' who are not approved
      const pendingTradies = await storage.getUsersByRoleAndApprovalStatus("tradie", false);
      res.json(pendingTradies);
    } catch (error) {
      console.error("Error getting pending tradies:", error);
      res.status(500).json({ message: "Failed to get pending tradies" });
    }
  });

  // Get approved tradies
  pmRouter.get("/tradies/approved", async (req: Request, res: Response) => {
    try {
      // Get users with role 'tradie' or 'contractor' who are approved
      const approvedTradies = await storage.getUsersByRoleAndApprovalStatus("contractor", true);
      res.json(approvedTradies);
    } catch (error) {
      console.error("Error getting approved tradies:", error);
      res.status(500).json({ message: "Failed to get approved tradies" });
    }
  });

  // Approve a tradie
  pmRouter.put("/tradies/:id/approve", async (req: Request, res: Response) => {
    try {
      const tradieId = parseInt(req.params.id);

      if (isNaN(tradieId)) {
        return res.status(400).json({ message: "Invalid tradie ID" });
      }

      // Check if the tradie exists
      const tradie = await storage.getUser(tradieId);

      if (!tradie) {
        return res.status(404).json({ message: "Tradie not found" });
      }

      if (!["tradie", "contractor"].includes(tradie.role)) {
        return res.status(400).json({ message: "User is not a tradie or contractor" });
      }

      if (tradie.isApproved) {
        return res.status(400).json({ message: "Tradie is already approved" });
      }

      // Approve the tradie
      const updatedTradie = await storage.updateUser(tradieId, {
        isApproved: true,
        approvedBy: req.user!.id,
        approvalDate: new Date()
      });

      // Create a notification for the tradie
      await storage.createNotification({
        userId: tradieId,
        title: "Account Approved",
        message: "Your account has been approved. You can now access the system.",
        type: "account_approval",
        isRead: false
      });

      res.json(updatedTradie);
    } catch (error) {
      console.error("Error approving tradie:", error);
      res.status(500).json({ message: "Failed to approve tradie" });
    }
  });

  // Reject a tradie
  pmRouter.put("/tradies/:id/reject", async (req: Request, res: Response) => {
    try {
      const tradieId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(tradieId)) {
        return res.status(400).json({ message: "Invalid tradie ID" });
      }

      // Check if the tradie exists
      const tradie = await storage.getUser(tradieId);

      if (!tradie) {
        return res.status(404).json({ message: "Tradie not found" });
      }

      if (!["tradie", "contractor"].includes(tradie.role)) {
        return res.status(400).json({ message: "User is not a tradie or contractor" });
      }

      // Reject the tradie by updating the user status
      // We keep the user in the system but mark them as rejected
      const updatedTradie = await storage.updateUser(tradieId, {
        isApproved: false,
        approvedBy: req.user!.id,
        approvalDate: new Date(),
        status: "rejected" // Add a status field to mark as rejected
      });

      // Create a notification for the tradie
      await storage.createNotification({
        userId: tradieId,
        title: "Account Rejected",
        message: reason ? `Your account registration was rejected: ${reason}` : "Your account registration was rejected.",
        type: "account_rejection",
        isRead: false
      });

      res.json(updatedTradie);
    } catch (error) {
      console.error("Error rejecting tradie:", error);
      res.status(500).json({ message: "Failed to reject tradie" });
    }
  });

  // Invite a tradie using token system
  pmRouter.post("/tradies/invite", requirePM, async (req: Request, res: Response) => {
    try {
      const { email, phone, personalMessage } = req.body;

      // Validate required fields
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check rate limiting for invitations
      const rateLimitCheck = await AccessControl.checkInvitationRateLimit(req.user!.id);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({ message: rateLimitCheck.reason });
      }

      // Validate invitation permissions
      const invitationCheck = await AccessControl.canSendInvitation(req.user!.id, email);
      if (!invitationCheck.canSend) {
        return res.status(400).json({ message: invitationCheck.reason });
      }

      // Check if email already exists in users table
      const existingUser = await storage.getUserByEmail(email);
      
      // Generate unique invitation token
      const invitationToken = crypto.randomUUID();
      
      // Set token expiry to 7 days from now
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7);

      // Create invitation record
      const invitation = await storage.createTradieInvitation({
        projectManagerId: req.user!.id,
        tradieId: existingUser?.id || null, // Link to existing user if found
        email,
        phone: phone || null,
        invitationToken,
        tokenExpiry,
        status: 'pending',
        personalMessage: personalMessage || null
      });

      if (existingUser) {
        // If user exists, send in-platform notification
        // Get company name for better notification content
        const business = req.user!.businessId ? await storage.getBusiness(req.user!.businessId) : null;
        const companyName = business?.name || 'a company';
        const pmName = `${req.user!.firstName} ${req.user!.lastName}`.trim() || 'Project Manager';
        
        await storage.createNotification({
          userId: existingUser.id,
          title: "New Company Invitation",
          message: `You've been invited to join ${companyName} by ${pmName}`,
          type: "invitation_received",
          relatedId: invitation.id,
          relatedType: "tradie_invitation"
        });
      } else {
        // If user doesn't exist, would send email invitation with registration link
        // TODO: Send email with invitation link containing token
        console.log(`Email invitation would be sent to ${email} with token: ${invitationToken}`);
      }

      // Send invitation email for new users (not yet registered)
      let emailSent = false;
      if (!existingUser) {
        // Validate email format before sending
        if (emailService.isValidEmail(email)) {
          // Check rate limiting
          if (emailService.checkRateLimit(email)) {
            emailSent = await emailService.sendInvitationEmail(
              email,
              req.user!.id,
              req.user!.businessId!,
              invitationToken,
              tokenExpiry.toISOString(),
              personalMessage
            );
          } else {
            return res.status(429).json({ message: "Too many invitations sent to this email. Please try again later." });
          }
        } else {
          return res.status(400).json({ message: "Invalid email address format" });
        }
      }

      res.status(201).json({
        message: existingUser 
          ? "Invitation sent to existing user" 
          : emailSent 
            ? "Invitation email sent successfully"
            : "Invitation created but email sending failed",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          expiryDate: invitation.tokenExpiry
        },
        emailSent: existingUser ? null : emailSent
      });
    } catch (error) {
      console.error("Error inviting tradie:", error);
      res.status(500).json({ message: "Failed to invite tradie" });
    }
  });

  // Get pending invitations sent by this PM
  pmRouter.get("/invitations/pending", async (req: Request, res: Response) => {
    try {
      const pendingInvitations = await storage.getPendingInvitationsByPM(req.user!.id);
      res.json(pendingInvitations);
    } catch (error) {
      console.error("Error getting pending invitations:", error);
      res.status(500).json({ message: "Failed to get pending invitations" });
    }
  });

  // Resend an invitation
  pmRouter.post("/invitations/:id/resend", async (req: Request, res: Response) => {
    try {
      const invitationId = parseInt(req.params.id);
      
      if (isNaN(invitationId)) {
        return res.status(400).json({ message: "Invalid invitation ID" });
      }

      // Verify the invitation belongs to this PM
      const invitation = await storage.getTradieInvitation(invitationId);
      if (!invitation || invitation.projectManagerId !== req.user!.id) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Generate new token and expiry
      const newToken = crypto.randomUUID();
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      await storage.resendTradieInvitation(invitationId, newToken, newExpiry);

      res.json({ message: "Invitation resent successfully" });
    } catch (error) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  // Cancel an invitation
  pmRouter.post("/invitations/:id/cancel", async (req: Request, res: Response) => {
    try {
      const invitationId = parseInt(req.params.id);
      
      if (isNaN(invitationId)) {
        return res.status(400).json({ message: "Invalid invitation ID" });
      }

      // Verify the invitation belongs to this PM
      const invitation = await storage.getTradieInvitation(invitationId);
      if (!invitation || invitation.projectManagerId !== req.user!.id) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      await storage.cancelTradieInvitation(invitationId);

      res.json({ message: "Invitation cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  // Remove a tradie from company (set isApproved to false)
  pmRouter.post("/tradies/:id/remove", async (req: Request, res: Response) => {
    try {
      const tradieId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(tradieId)) {
        return res.status(400).json({ message: "Invalid tradie ID" });
      }

      // Check if the tradie exists and is approved
      const tradie = await storage.getUser(tradieId);
      if (!tradie) {
        return res.status(404).json({ message: "Tradie not found" });
      }

      if (!["tradie", "contractor"].includes(tradie.role)) {
        return res.status(400).json({ message: "User is not a tradie or contractor" });
      }

      if (!tradie.isApproved) {
        return res.status(400).json({ message: "Tradie is already removed" });
      }

      // Remove the tradie (set isApproved to false)
      await storage.updateUser(tradieId, {
        isApproved: false
      });

      // Send removal notification
      await storage.createNotification({
        userId: tradieId,
        title: "Access Removed",
        message: reason ? `Your access has been removed: ${reason}` : "Your access to the company has been removed.",
        type: "account_removal",
        isRead: false
      });

      res.json({ message: "Tradie removed successfully" });
    } catch (error) {
      console.error("Error removing tradie:", error);
      res.status(500).json({ message: "Failed to remove tradie" });
    }
  });

  // Get tradies in PM's company (including removed ones)
  pmRouter.get("/tradies/company", async (req: Request, res: Response) => {
    try {
      // Get PM's business
      const pm = await storage.getUser(req.user!.id);
      if (!pm || !pm.businessId) {
        return res.status(400).json({ message: "PM business not found" });
      }

      // Get all tradies in the same business
      const tradies = await storage.getUsersByRole("tradie");
      const companyTradies = tradies.filter(tradie => tradie.businessId === pm.businessId);

      // Add status for display
      const tradiesWithStatus = companyTradies.map(tradie => ({
        ...tradie,
        displayStatus: tradie.isApproved ? "Approved" : "Removed"
      }));

      res.json(tradiesWithStatus);
    } catch (error) {
      console.error("Error getting company tradies:", error);
      res.status(500).json({ message: "Failed to get company tradies" });
    }
  });

  // Get tradie order history
  pmRouter.get("/tradies/:id/orders", async (req: Request, res: Response) => {
    try {
      const tradieId = parseInt(req.params.id);

      if (isNaN(tradieId)) {
        return res.status(400).json({ message: "Invalid tradie ID" });
      }

      // Check if the tradie exists
      const tradie = await storage.getUser(tradieId);

      if (!tradie) {
        return res.status(404).json({ message: "Tradie not found" });
      }

      if (tradie.role !== "tradie") {
        return res.status(400).json({ message: "User is not a tradie" });
      }

      // Get orders created by this tradie
      const orders = await storage.getOrdersByUser(tradieId);

      res.json(orders);
    } catch (error) {
      console.error("Error getting tradie orders:", error);
      res.status(500).json({ message: "Failed to get tradie orders" });
    }
  });

  // Get tradie job assignments
  pmRouter.get("/tradies/:id/jobs", async (req: Request, res: Response) => {
    try {
      const tradieId = parseInt(req.params.id);

      if (isNaN(tradieId)) {
        return res.status(400).json({ message: "Invalid tradie ID" });
      }

      // Check if the tradie exists
      const tradie = await storage.getUser(tradieId);

      if (!tradie) {
        return res.status(404).json({ message: "Tradie not found" });
      }

      if (tradie.role !== "tradie") {
        return res.status(400).json({ message: "User is not a tradie" });
      }

      // Get job assignments for this tradie
      const jobAssignments = await storage.getJobUsersByUser(tradieId);

      // Enrich with job details
      const enrichedAssignments = [];
      for (const assignment of jobAssignments) {
        const job = await storage.getJob(assignment.jobId);
        if (job) {
          enrichedAssignments.push({
            ...assignment,
            jobName: job.name,
            jobNumber: job.jobNumber,
            jobStatus: job.status,
          });
        }
      }

      res.json(enrichedAssignments);
    } catch (error) {
      console.error("Error getting tradie job assignments:", error);
      res.status(500).json({ message: "Failed to get tradie job assignments" });
    }
  });

  // Get all clients (for job creation/assignment)
  pmRouter.get("/clients", async (req: Request, res: Response) => {
    try {
      // Get the PM's business ID
      const pmId = req.user!.id;
      const pm = await storage.getUser(pmId);

      if (!pm || !pm.businessId) {
        return res.status(400).json({ message: "PM business not found" });
      }

      const clients = await storage.getClientsByBusiness(pm.businessId);
      res.json(clients);
    } catch (error) {
      console.error("Error getting clients:", error);
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  // Parts catalog endpoints for PMs

  // Get all parts with optional filtering
  pmRouter.get("/parts", async (req: Request, res: Response) => {
    try {
      const { type, category, search } = req.query;

      let parts: any[] = [];

      if (type) {
        parts = await storage.getPartsByType(type as string);
      } else {
        parts = await storage.getAllParts();
      }

      // Apply additional filtering
      if (category) {
        parts = parts.filter(part => 
          part.category && part.category.toLowerCase() === (category as string).toLowerCase()
        );
      }

      // Apply search filtering
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        parts = parts.filter(part => 
          part.description.toLowerCase().includes(searchTerm) ||
          part.item_code.toLowerCase().includes(searchTerm) ||
          (part.manufacturer && part.manufacturer.toLowerCase().includes(searchTerm))
        );
      }

      res.json(parts);
    } catch (error) {
      console.error("Error getting parts:", error);
      res.status(500).json({ message: "Failed to get parts" });
    }
  });

  // Get part by ID
  pmRouter.get("/parts/:id", async (req: Request, res: Response) => {
    try {
      const partId = parseInt(req.params.id);

      if (isNaN(partId)) {
        return res.status(400).json({ message: "Invalid part ID" });
      }

      const part = await storage.getPart(partId);

      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }

      res.json(part);
    } catch (error) {
      console.error("Error getting part:", error);
      res.status(500).json({ message: "Failed to get part" });
    }
  });

  // Get all part categories (distinct)
  pmRouter.get("/parts/categories", async (_req: Request, res: Response) => {
    try {
      const parts = await storage.getAllParts();

      // Get distinct categories, excluding null/undefined
      const categories = Array.from(new Set(
        parts
          .map(part => part.category)
          .filter(category => category) // Filter out null/undefined values
      ));

      res.json(categories);
    } catch (error) {
      console.error("Error getting part categories:", error);
      // Include more detailed error information
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Detailed error:", errorMessage);
      res.status(500).json({ message: "Failed to get part categories", error: errorMessage });
    }
  });

  // Get all part types (distinct)
  pmRouter.get("/parts/types", async (_req: Request, res: Response) => {
    try {
      const parts = await storage.getAllParts();

      // Get distinct types
      const types = Array.from(new Set(
        parts.map(part => part.type)
      ));

      res.json(types);
    } catch (error) {
      console.error("Error getting part types:", error);
      // Include more detailed error information
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Detailed error:", errorMessage);
      res.status(500).json({ message: "Failed to get part types", error: errorMessage });
    }
  });

  // Add part to job
  pmRouter.post("/jobs/:jobId/parts", async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { partId, quantity, notes } = req.body;

      if (isNaN(jobId) || !partId || quantity < 1) {
        return res.status(400).json({ message: "Invalid job ID, part ID, or quantity" });
      }

      // Check if the job exists and PM has access
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.projectManagerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to modify this job" });
      }

      // Check if the part exists
      const part = await storage.getPart(partId);

      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }

      // Add the part to the job
      const jobPart = await storage.addJobPart({
        jobId,
        partId,
        quantity,
        notes: notes || "",
        addedBy: req.user!.id
      });

      res.status(201).json(jobPart);
    } catch (error) {
      console.error("Error adding part to job:", error);
      res.status(500).json({ message: "Failed to add part to job" });
    }
  });

  // Recommend a part to tradies
  pmRouter.post("/parts/:partId/recommend", async (req: Request, res: Response) => {
    try {
      const partId = parseInt(req.params.partId);
      const { jobId, message } = req.body;

      if (isNaN(partId) || !jobId) {
        return res.status(400).json({ message: "Invalid part ID or job ID" });
      }

      // Check if the job exists and PM has access
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.projectManagerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized for this job" });
      }

      // Check if the part exists
      const part = await storage.getPart(partId);

      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }

      // Get tradies assigned to the job
      const jobUsers = await storage.getJobUsersByJob(jobId);

      if (!jobUsers.length) {
        return res.status(400).json({ message: "No tradies assigned to this job" });
      }

      // Create notifications for each tradie
      const notifications = [];
      for (const jobUser of jobUsers) {
        // Create notification for each tradie
        const notification = await storage.createNotification({
          title: "Part Recommendation",
          message: message || `Your project manager has recommended ${part.description} for job ${job.name}`,
          type: "part_recommendation",
          userId: jobUser.userId,
          isRead: false,
          relatedId: partId,
          relatedType: "part",
          jobId
        });

        notifications.push(notification);
      }

      res.status(201).json({ 
        message: `Recommended to ${notifications.length} tradies`,
        count: notifications.length
      });
    } catch (error) {
      console.error("Error recommending part:", error);
      res.status(500).json({ message: "Failed to recommend part" });
    }
  });

  // Register notification routes
  apiRouter.use('/notifications', notificationRouter);

  // Register tradie routes
  apiRouter.use('/tradies', tradieRouter);

  const httpServer = createServer(app);
  return httpServer;
}