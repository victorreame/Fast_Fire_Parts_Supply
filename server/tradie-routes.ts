import express, { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { insertTradieInvitationSchema, insertNotificationSchema } from '@shared/schema';
import { z } from 'zod';

const tradieRouter = express.Router();

// Middleware to check if user is authenticated and is a tradie
const isTradie = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (!req.user || req.user.role !== 'tradie') {
    return res.status(403).json({ message: "Not authorized. Tradie role required." });
  }
  
  next();
};

// Get all invitations for the authenticated tradie
tradieRouter.get('/invitations', isTradie, async (req: Request, res: Response) => {
  try {
    const invitations = await storage.getTradieInvitations(req.user!.id);
    
    // Enhance invitations with PM names
    const enhancedInvitations = await Promise.all(
      invitations.map(async invitation => {
        const pm = await storage.getUser(invitation.projectManagerId);
        return {
          ...invitation,
          projectManagerName: pm ? `${pm.firstName} ${pm.lastName}` : 'Unknown Project Manager'
        };
      })
    );
    
    res.json(enhancedInvitations);
  } catch (error) {
    console.error("Error getting tradie invitations:", error);
    res.status(500).json({ message: "Failed to get invitations" });
  }
});

// Accept an invitation
tradieRouter.post('/invitations/:id/accept', isTradie, async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id);
    
    if (isNaN(invitationId)) {
      return res.status(400).json({ message: "Invalid invitation ID" });
    }
    
    const invitation = await storage.getTradieInvitation(invitationId);
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    
    // Check if invitation belongs to the requesting tradie
    if (invitation.tradieId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to accept this invitation" });
    }
    
    // Only allow accepting pending invitations
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "This invitation cannot be accepted" });
    }
    
    // Accept the invitation and update the tradie status
    const acceptedInvitation = await storage.acceptTradieInvitation(invitationId);
    
    // Update the tradie's status to active
    await storage.updateUserStatus(req.user!.id, 'active');
    
    // Create notifications for both tradie and PM
    const tradieNotification = {
      userId: req.user!.id,
      title: "Invitation Accepted",
      message: "You have accepted the project manager's invitation. You now have full access to the platform.",
      type: "invitation_accepted",
      relatedId: invitationId,
      relatedType: "tradie_invitation"
    };
    
    const pmNotification = {
      userId: invitation.projectManagerId,
      title: "Invitation Accepted",
      message: `${req.user!.firstName} ${req.user!.lastName} has accepted your invitation.`,
      type: "invitation_accepted",
      relatedId: invitationId,
      relatedType: "tradie_invitation"
    };
    
    await storage.createNotification(tradieNotification);
    await storage.createNotification(pmNotification);
    
    res.json(acceptedInvitation);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ message: "Failed to accept invitation" });
  }
});

// Reject an invitation
tradieRouter.post('/invitations/:id/reject', isTradie, async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id);
    
    if (isNaN(invitationId)) {
      return res.status(400).json({ message: "Invalid invitation ID" });
    }
    
    const invitation = await storage.getTradieInvitation(invitationId);
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    
    // Check if invitation belongs to the requesting tradie
    if (invitation.tradieId !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to reject this invitation" });
    }
    
    // Only allow rejecting pending invitations
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "This invitation cannot be rejected" });
    }
    
    // Reject the invitation
    const rejectedInvitation = await storage.rejectTradieInvitation(invitationId);
    
    // Create notification for PM
    const pmNotification = {
      userId: invitation.projectManagerId,
      title: "Invitation Rejected",
      message: `${req.user!.firstName} ${req.user!.lastName} has declined your invitation.`,
      type: "invitation_rejected",
      relatedId: invitationId,
      relatedType: "tradie_invitation"
    };
    
    await storage.createNotification(pmNotification);
    
    res.json(rejectedInvitation);
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    res.status(500).json({ message: "Failed to reject invitation" });
  }
});

export default tradieRouter;