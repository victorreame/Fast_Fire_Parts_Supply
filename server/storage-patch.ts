import { eq, and, count, desc } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  notifications, 
  tradieInvitations
} from "@shared/schema";

// Add these methods to the DatabaseStorage class in storage.ts

// User status update
async updateUserStatus(userId: number, status: string): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set({ status })
    .where(eq(users.id, userId))
    .returning();
  return user;
}

// Get user notifications
async getUserNotifications(userId: number): Promise<Notification[]> {
  return await db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

// Get unread notification count
async getUnreadNotificationCount(userId: number): Promise<number> {
  const unreadNotifications = await db.select({ count: count() })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  return unreadNotifications[0]?.count || 0;
}

// Tradie invitation methods
async acceptTradieInvitation(invitationId: number): Promise<TradieInvitation | undefined> {
  const [invitation] = await db
    .update(tradieInvitations)
    .set({
      status: 'accepted',
      responseDate: new Date()
    })
    .where(eq(tradieInvitations.id, invitationId))
    .returning();
  return invitation;
}

async rejectTradieInvitation(invitationId: number): Promise<TradieInvitation | undefined> {
  const [invitation] = await db
    .update(tradieInvitations)
    .set({
      status: 'rejected',
      responseDate: new Date()
    })
    .where(eq(tradieInvitations.id, invitationId))
    .returning();
  return invitation;
}

// Get tradie invitations
async getTradieInvitations(tradieId: number): Promise<TradieInvitation[]> {
  return await db
    .select()
    .from(tradieInvitations)
    .where(eq(tradieInvitations.tradieId, tradieId))
    .orderBy(desc(tradieInvitations.invitationDate));
}