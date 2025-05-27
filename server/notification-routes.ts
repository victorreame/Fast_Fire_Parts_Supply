import express, { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { insertNotificationSchema } from '@shared/schema';
import { z } from 'zod';

const notificationRouter = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

// Get all notifications for the current user with filtering and pagination
notificationRouter.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      read, 
      search, 
      type 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get notifications with filters
    let notifications = await storage.getUserNotifications(req.user!.id);
    let total = notifications.length;

    // Apply filters
    if (read !== undefined) {
      notifications = notifications.filter(n => n.isRead === (read === 'true'));
    }
    
    if (type && type !== 'all') {
      notifications = notifications.filter(n => n.type === type);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      notifications = notifications.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.message.toLowerCase().includes(searchLower)
      );
    }

    total = notifications.length;

    // Apply pagination
    const paginatedNotifications = notifications.slice(offset, offset + limitNum);

    res.json({
      notifications: paginatedNotifications,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore: offset + paginatedNotifications.length < total
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ message: "Failed to get notifications" });
  }
});

// Get unread notification count
notificationRouter.get('/unread/count', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const count = await storage.getUnreadNotificationCount(req.user!.id);
    res.json({ count });
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    res.status(500).json({ message: "Failed to get unread notification count" });
  }
});

// Mark a notification as read
notificationRouter.put('/:id/read', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const notification = await storage.getNotification(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Check if notification belongs to the requesting user
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to update this notification" });
    }
    
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    res.json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read for the current user
notificationRouter.put('/all/read', isAuthenticated, async (req: Request, res: Response) => {
  try {
    await storage.markAllNotificationsAsRead(req.user!.id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

// Create a notification (admin or system only)
notificationRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Only allow authenticated users with admin role or internal system calls
    if (req.isAuthenticated() && req.user.role !== 'admin' && req.ip !== '127.0.0.1') {
      return res.status(403).json({ message: "Not authorized to create notifications" });
    }
    
    const notificationData = insertNotificationSchema.parse(req.body);
    const notification = await storage.createNotification(notificationData);
    res.status(201).json(notification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
    }
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

export default notificationRouter;