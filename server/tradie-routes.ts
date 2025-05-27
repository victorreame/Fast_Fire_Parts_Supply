import express, { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { emailService } from './email-service';
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
    const invitations = await storage.getTradieInvitationsByTradie(req.user!.id);
    
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
    
    // Check if invitation is for this tradie's email
    if (invitation.email !== req.user!.email) {
      return res.status(403).json({ message: "Not authorized to accept this invitation" });
    }
    
    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been responded to" });
    }
    
    // Check if invitation is not expired
    if (new Date(invitation.tokenExpiry) < new Date()) {
      return res.status(400).json({ message: "This invitation has expired" });
    }
    
    // Get PM details for company assignment
    const pm = await storage.getUser(invitation.projectManagerId);
    if (!pm) {
      return res.status(404).json({ message: "Project manager not found" });
    }
    
    // Accept the invitation
    await storage.updateTradieInvitationStatus(invitationId, 'accepted', new Date());
    
    // Update tradie's company association and approval status
    await storage.updateUser(req.user!.id, {
      businessId: pm.businessId,
      isApproved: true,
      approvedBy: invitation.projectManagerId,
      status: 'active'
    });
    
    // Remove related notification
    const notifications = await storage.getNotificationsByUser(req.user!.id);
    const relatedNotification = notifications.find(n => 
      n.type === 'company_invitation' && 
      n.relatedId === invitationId && 
      n.relatedType === 'invitation'
    );
    
    if (relatedNotification) {
      await storage.deleteNotification(relatedNotification.id);
    }
    
    // Create confirmation notification for tradie
    await storage.createNotification({
      userId: req.user!.id,
      title: "Welcome to Your New Company",
      message: `You've successfully joined ${pm.firstName} ${pm.lastName}'s company. You now have full access to the platform.`,
      type: "invitation_accepted",
      relatedId: invitationId,
      relatedType: "invitation"
    });
    
    // Create notification for PM about acceptance
    await storage.createNotification({
      userId: invitation.projectManagerId,
      title: "Invitation Accepted",
      message: `${req.user!.firstName} ${req.user!.lastName} has accepted your company invitation.`,
      type: "invitation_response",
      relatedId: invitationId,
      relatedType: "invitation"
    });
    
    res.json({
      message: "Invitation accepted successfully",
      companyName: pm.businessId ? (await storage.getBusiness(pm.businessId))?.name : "the company"
    });
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
    
    // Check if invitation is for this tradie's email
    if (invitation.email !== req.user!.email) {
      return res.status(403).json({ message: "Not authorized to reject this invitation" });
    }
    
    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "This invitation has already been responded to" });
    }
    
    // Get PM details for notifications
    const pm = await storage.getUser(invitation.projectManagerId);
    if (!pm) {
      return res.status(404).json({ message: "Project manager not found" });
    }
    
    // Reject the invitation
    await storage.updateTradieInvitationStatus(invitationId, 'rejected', new Date());
    
    // Remove related notification
    const notifications = await storage.getNotificationsByUser(req.user!.id);
    const relatedNotification = notifications.find(n => 
      n.type === 'company_invitation' && 
      n.relatedId === invitationId && 
      n.relatedType === 'invitation'
    );
    
    if (relatedNotification) {
      await storage.deleteNotification(relatedNotification.id);
    }
    
    // Create notification for PM about rejection
    await storage.createNotification({
      userId: invitation.projectManagerId,
      title: "Invitation Declined",
      message: `${req.user!.firstName} ${req.user!.lastName} has declined your company invitation.`,
      type: "invitation_response",
      relatedId: invitationId,
      relatedType: "invitation"
    });
    
    res.json({
      message: "Invitation rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    res.status(500).json({ message: "Failed to reject invitation" });
  }
});

// Get invitation details by token (for external registration)
tradieRouter.get('/invitations/token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const invitation = await storage.getTradieInvitationByToken(token);
    
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    
    // Check if invitation is expired
    if (new Date(invitation.tokenExpiry) < new Date()) {
      return res.status(400).json({ message: "Invitation has expired" });
    }
    
    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "Invitation has already been responded to" });
    }
    
    // Get PM details
    const pm = await storage.getUser(invitation.projectManagerId);
    
    res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        personalMessage: invitation.personalMessage,
        createdAt: invitation.createdAt,
        tokenExpiry: invitation.tokenExpiry
      },
      projectManager: pm ? {
        name: `${pm.firstName} ${pm.lastName}`,
        businessId: pm.businessId
      } : null
    });
  } catch (error) {
    console.error("Error getting invitation by token:", error);
    res.status(500).json({ message: "Failed to get invitation details" });
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