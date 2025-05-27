import express, { Request, Response } from "express";
import { storage } from "./storage";
import { requireAuth } from "./access-control";
import { emailService } from "./email-service";
import { db } from "./db";
import { tradieInvitations } from "../shared/schema";
import { eq } from "drizzle-orm";

const tradieRouter = express.Router();

// Get invitations for the current tradie
tradieRouter.get("/invitations", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Get all invitations for this tradie by email - query database directly
    const allInvitations = await db
      .select()
      .from(tradieInvitations)
      .where(eq(tradieInvitations.email, userEmail));
    
    // Filter only pending invitations and add company/PM info
    const pendingInvitations = [];
    for (const invitation of allInvitations) {
      if (invitation.status === 'pending') {
        // Get PM and company info
        const pm = await storage.getUser(invitation.projectManagerId);
        let companyName = '';
        
        if (pm && pm.businessId) {
          const company = await storage.getBusiness(pm.businessId);
          companyName = company?.name || '';
        }

        pendingInvitations.push({
          ...invitation,
          pmName: pm ? `${pm.firstName} ${pm.lastName}` : 'Project Manager',
          companyName
        });
      }
    }

    res.json(pendingInvitations);
  } catch (error) {
    console.error("Error getting tradie invitations:", error);
    res.status(500).json({ message: "Failed to get invitations" });
  }
});

// Accept an invitation
tradieRouter.post("/invitations/:id/accept", requireAuth, async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = req.user!.id;

    if (isNaN(invitationId)) {
      return res.status(400).json({ message: "Invalid invitation ID" });
    }

    // Get the invitation
    const invitation = await storage.getTradieInvitation(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Verify invitation belongs to this user's email
    if (invitation.email !== req.user!.email) {
      return res.status(403).json({ message: "Invitation does not belong to you" });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "Invitation is no longer pending" });
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.tokenExpiry)) {
      return res.status(400).json({ message: "Invitation has expired" });
    }

    // Get PM and company info
    const pm = await storage.getUser(invitation.projectManagerId);
    if (!pm || !pm.businessId) {
      return res.status(400).json({ message: "Invalid invitation - PM or company not found" });
    }

    // Update invitation status
    await storage.updateTradieInvitationStatus(invitationId, 'accepted', new Date());

    // Update user to join the company
    await storage.updateUser(userId, {
      businessId: pm.businessId,
      isApproved: true,
      approvedBy: pm.id,
      approvalDate: new Date()
    });

    // Create notification for the tradie
    await storage.createNotification({
      userId: userId,
      title: "Welcome to the Team!",
      message: `You've successfully joined ${pm.businessId ? (await storage.getBusiness(pm.businessId))?.name : 'the company'}. You now have full access to company features.`,
      type: "invitation_accepted",
      relatedId: invitationId,
      relatedType: "invitation"
    });

    // Create notification for the PM
    await storage.createNotification({
      userId: pm.id,
      title: "Invitation Accepted",
      message: `${req.user!.firstName} ${req.user!.lastName} has accepted your company invitation.`,
      type: "invitation_accepted",
      relatedId: invitationId,
      relatedType: "invitation"
    });

    // Send email notification to PM
    await emailService.sendPMNotificationEmail(
      pm.id,
      userId,
      'accepted'
    );

    res.json({ 
      message: "Invitation accepted successfully",
      companyId: pm.businessId
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ message: "Failed to accept invitation" });
  }
});

// Reject an invitation
tradieRouter.post("/invitations/:id/reject", requireAuth, async (req: Request, res: Response) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = req.user!.id;

    if (isNaN(invitationId)) {
      return res.status(400).json({ message: "Invalid invitation ID" });
    }

    // Get the invitation
    const invitation = await storage.getTradieInvitation(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Verify invitation belongs to this user's email
    if (invitation.email !== req.user!.email) {
      return res.status(403).json({ message: "Invitation does not belong to you" });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: "Invitation is no longer pending" });
    }

    // Update invitation status
    await storage.updateTradieInvitationStatus(invitationId, 'rejected', new Date());

    // Get PM info for notifications
    const pm = await storage.getUser(invitation.projectManagerId);
    if (pm) {
      // Create notification for the PM
      await storage.createNotification({
        userId: pm.id,
        title: "Invitation Declined",
        message: `${req.user!.firstName} ${req.user!.lastName} has declined your company invitation.`,
        type: "invitation_rejected",
        relatedId: invitationId,
        relatedType: "invitation"
      });

      // Send email notification to PM
      await emailService.sendPMNotificationEmail(
        pm.id,
        userId,
        'rejected'
      );
    }

    res.json({ message: "Invitation declined successfully" });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    res.status(500).json({ message: "Failed to reject invitation" });
  }
});

export default tradieRouter;