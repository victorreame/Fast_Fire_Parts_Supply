import { Router, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { notifications, users, tradieInvitations } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Create router for tradie-specific routes
const tradieRouter = Router();

// Middleware to check if the user is a tradie
const isTradie = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'contractor') {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Tradie role required." });
};

// Get pending invitations for the current tradie
tradieRouter.get('/invitations', isTradie, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const invitations = await db.select({
      id: tradieInvitations.id,
      projectManagerId: tradieInvitations.projectManagerId,
      status: tradieInvitations.status,
      notes: tradieInvitations.notes,
      invitationDate: tradieInvitations.createdAt,
      projectManagerName: users.firstName
    })
    .from(tradieInvitations)
    .leftJoin(users, eq(tradieInvitations.projectManagerId, users.id))
    .where(
      and(
        eq(tradieInvitations.tradieId, userId)
      )
    )
    .orderBy(desc(tradieInvitations.createdAt));

    return res.json(invitations);
  } catch (error) {
    console.error("Error fetching tradie invitations:", error);
    return res.status(500).json({ message: "Failed to retrieve invitations" });
  }
});

// Accept an invitation from a project manager
tradieRouter.post('/invitations/:id/accept', isTradie, async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Get the invitation
    const [invitation] = await db.select()
      .from(tradieInvitations)
      .where(
        and(
          eq(tradieInvitations.id, invitationId),
          eq(tradieInvitations.tradieId, userId)
        )
      );
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been processed" });
    }
    
    // Update invitation status
    await db.update(tradieInvitations)
      .set({ 
        status: 'accepted',
        responseDate: new Date()
      })
      .where(eq(tradieInvitations.id, invitationId));
    
    // Update user approval status
    await db.update(users)
      .set({ 
        isApproved: true,
        status: 'active',
        approvalDate: new Date()
      })
      .where(eq(users.id, userId));
    
    // Create notifications for both parties
    const pmNotification = {
      userId: invitation.projectManagerId,
      type: 'connection_accepted',
      title: 'Connection Request Accepted',
      message: `${req.user!.firstName || req.user!.username} has accepted your connection request.`,
      isRead: false,
      createdAt: new Date()
    };
    
    const tradieNotification = {
      userId: userId,
      type: 'connection_accepted',
      title: 'Connection Established',
      message: `You've accepted the connection request. You now have full access to the system.`,
      isRead: false,
      createdAt: new Date()
    };
    
    await db.insert(notifications).values(pmNotification);
    await db.insert(notifications).values(tradieNotification);
    
    return res.status(200).json({ message: "Invitation accepted successfully" });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({ message: "Failed to accept invitation" });
  }
});

// Reject an invitation from a project manager
tradieRouter.post('/invitations/:id/reject', isTradie, async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Get the invitation
    const [invitation] = await db.select()
      .from(tradieInvitations)
      .where(
        and(
          eq(tradieInvitations.id, invitationId),
          eq(tradieInvitations.tradieId, userId)
        )
      );
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been processed" });
    }
    
    // Update invitation status
    await db.update(tradieInvitations)
      .set({ 
        status: 'rejected',
        responseDate: new Date()
      })
      .where(eq(tradieInvitations.id, invitationId));
    
    // Create notification for PM
    const pmNotification = {
      userId: invitation.projectManagerId,
      type: 'connection_rejected',
      title: 'Connection Request Declined',
      message: `${req.user!.firstName || req.user!.username} has declined your connection request.`,
      isRead: false,
      createdAt: new Date()
    };
    
    await db.insert(notifications).values(pmNotification);
    
    return res.status(200).json({ message: "Invitation rejected successfully" });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    return res.status(500).json({ message: "Failed to reject invitation" });
  }
});

export default tradieRouter;