import { Router, Request, Response } from "express";
import { db } from "./db";
import { notifications } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Create router for notification-specific routes
const notificationRouter = Router();

// Get all notifications for the current user
notificationRouter.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    return res.json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to retrieve notifications" });
  }
});

// Get the count of unread notifications for current user
notificationRouter.get('/unread/count', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    
    const unreadCount = await db.select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .then(result => result.length);
    
    return res.json(unreadCount);
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    return res.status(500).json({ message: "Failed to count unread notifications" });
  }
});

// Mark a notification as read
notificationRouter.put('/:id/read', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify the notification belongs to the user
    const [notification] = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Update notification to read
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
    
    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

// Mark all notifications as read
notificationRouter.put('/all/read', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = req.user.id;
    
    // Update all user's notifications to read
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Failed to update notifications" });
  }
});

export default notificationRouter;