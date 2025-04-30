import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import { isBefore } from "date-fns";
import { randomBytes } from "crypto";
import { insertTradieInvitationSchema, tradieInvitations, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Middleware to check if user is a project manager
const isPM = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (req.user.role !== "project_manager") {
    return res.status(403).json({ error: "Not authorized" });
  }
  
  next();
};

// Create an invitation for a tradie
router.post("/invitations", isPM, async (req, res) => {
  try {
    const validationSchema = insertTradieInvitationSchema.pick({
      email: true,
      phone: true,
    });
    
    const validatedData = validationSchema.parse(req.body);
    
    // Check if invitation already exists
    const existingInvitation = await storage.getTradieInvitationByEmail(validatedData.email);
    if (existingInvitation) {
      return res.status(400).json({ error: "Invitation already exists for this email" });
    }
    
    // Generate invitation token
    const token = randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Token valid for 7 days
    
    // Create invitation
    const invitation = await storage.createTradieInvitation({
      projectManagerId: req.user.id,
      tradieId: null,
      email: validatedData.email,
      phone: validatedData.phone || null,
      invitationToken: token,
      tokenExpiry,
      status: "pending",
      createdAt: new Date(),
    });
    
    // TODO: Send email to tradie with invitation link
    
    res.status(201).json({ 
      id: invitation.id,
      email: invitation.email,
      status: invitation.status, 
      message: "Invitation created successfully"
    });
  } catch (error) {
    console.error("Error creating tradie invitation:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

// Get all invitations for PM
router.get("/invitations", isPM, async (req, res) => {
  try {
    const invitations = await storage.getTradieInvitationsByPM(req.user.id);
    res.json(invitations);
  } catch (error) {
    console.error("Error fetching tradie invitations:", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// Verify invitation token
router.get("/invitations/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    
    // Find invitation by token
    const [invitation] = await storage.db
      .select()
      .from(tradieInvitations)
      .where(eq(tradieInvitations.invitationToken, token));
    
    if (!invitation) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }
    
    // Check if token is expired
    if (invitation.tokenExpiry && isBefore(new Date(invitation.tokenExpiry), new Date())) {
      return res.status(400).json({ error: "Invitation has expired" });
    }
    
    // Return invitation details (without sensitive info)
    res.json({
      id: invitation.id,
      email: invitation.email,
      status: invitation.status
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    res.status(500).json({ error: "Failed to verify invitation" });
  }
});

// Register as tradie with invitation
router.post("/register/tradie", async (req, res) => {
  try {
    const { invitationId, firstName, lastName, username, password, phone } = req.body;
    
    // Validate required fields
    if (!invitationId || !firstName || !lastName || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Get invitation
    const invitation = await storage.getTradieInvitation(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: "Invalid invitation" });
    }
    
    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "Invitation has already been used or canceled" });
    }
    
    // Check if token is expired
    if (invitation.tokenExpiry && isBefore(new Date(invitation.tokenExpiry), new Date())) {
      return res.status(400).json({ error: "Invitation has expired" });
    }
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Create verification token for email verification
    const verificationToken = randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 1); // 24 hours to verify email
    
    // Create user
    const user = await storage.createUser({
      username,
      password, // Will be hashed in storage implementation
      firstName,
      lastName,
      email: invitation.email,
      phone: phone || invitation.phone,
      role: "tradie",
      status: "pending_approval",
      verificationToken,
      tokenExpiry,
      isEmailVerified: false,
    });
    
    // Update invitation status
    await storage.updateTradieInvitationStatus(invitation.id, "accepted", new Date());
    
    // Update invitation with tradie ID
    await storage.db
      .update(tradieInvitations)
      .set({ tradieId: user.id })
      .where(eq(tradieInvitations.id, invitation.id));
    
    // Create notification for project manager
    await storage.createNotification({
      userId: invitation.projectManagerId,
      type: "tradie_registration",
      message: `Tradie ${firstName} ${lastName} has registered and is pending approval.`,
      relatedId: user.id,
      isRead: false,
      createdAt: new Date()
    });
    
    // TODO: Send verification email to tradie
    
    res.status(201).json({ 
      message: "Registration successful. Please check your email to verify your account.", 
      userId: user.id 
    });
  } catch (error) {
    console.error("Error registering tradie:", error);
    res.status(500).json({ error: "Failed to register" });
  }
});

// Verify tradie email
router.get("/verify-email/:token", async (req, res) => {
  try {
    const token = req.params.token;
    
    // Find user by verification token
    const user = await storage.db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token))
      .limit(1);
    
    if (!user || user.length === 0) {
      return res.status(404).json({ error: "Invalid verification token" });
    }
    
    const foundUser = user[0];
    
    // Check if token is expired
    if (foundUser.tokenExpiry && isBefore(new Date(foundUser.tokenExpiry), new Date())) {
      return res.status(400).json({ error: "Verification token has expired" });
    }
    
    // Update user as verified
    await storage.updateUser(foundUser.id, {
      isEmailVerified: true,
      verificationToken: null,
      tokenExpiry: null
    });
    
    res.json({ message: "Email verification successful. You can now log in." });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

// Cancel invitation (by PM)
router.delete("/invitations/:id", isPM, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    if (isNaN(invitationId)) {
      return res.status(400).json({ error: "Invalid invitation ID" });
    }
    
    // Get invitation
    const invitation = await storage.getTradieInvitation(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }
    
    // Check if PM has permission
    if (invitation.projectManagerId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to cancel this invitation" });
    }
    
    // Update invitation status
    await storage.updateTradieInvitationStatus(invitationId, "canceled", new Date());
    
    res.json({ message: "Invitation canceled successfully" });
  } catch (error) {
    console.error("Error canceling invitation:", error);
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
});

// Approve tradie (by PM)
router.post("/tradies/:id/approve", isPM, async (req, res) => {
  try {
    const tradieId = parseInt(req.params.id);
    if (isNaN(tradieId)) {
      return res.status(400).json({ error: "Invalid tradie ID" });
    }
    
    // Get tradie
    const tradie = await storage.getUser(tradieId);
    if (!tradie) {
      return res.status(404).json({ error: "Tradie not found" });
    }
    
    // Check if tradie is pending approval
    if (tradie.status !== "pending_approval") {
      return res.status(400).json({ error: "Tradie is not pending approval" });
    }
    
    // Update tradie status
    await storage.updateUser(tradieId, {
      status: "approved",
      approvedBy: req.user.id,
      approvalDate: new Date()
    });
    
    // Create notification for tradie
    await storage.createNotification({
      userId: tradieId,
      type: "approval",
      message: "Your account has been approved. You can now use the platform.",
      relatedId: req.user.id,
      isRead: false,
      createdAt: new Date()
    });
    
    res.json({ message: "Tradie approved successfully" });
  } catch (error) {
    console.error("Error approving tradie:", error);
    res.status(500).json({ error: "Failed to approve tradie" });
  }
});

// Reject tradie (by PM)
router.post("/tradies/:id/reject", isPM, async (req, res) => {
  try {
    const tradieId = parseInt(req.params.id);
    if (isNaN(tradieId)) {
      return res.status(400).json({ error: "Invalid tradie ID" });
    }
    
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    
    // Get tradie
    const tradie = await storage.getUser(tradieId);
    if (!tradie) {
      return res.status(404).json({ error: "Tradie not found" });
    }
    
    // Check if tradie is pending approval
    if (tradie.status !== "pending_approval") {
      return res.status(400).json({ error: "Tradie is not pending approval" });
    }
    
    // Update tradie status
    await storage.updateUser(tradieId, {
      status: "rejected",
      approvedBy: req.user.id,
      approvalDate: new Date()
    });
    
    // Create notification for tradie
    await storage.createNotification({
      userId: tradieId,
      type: "rejection",
      message: `Your account application was rejected. Reason: ${reason}`,
      relatedId: req.user.id,
      isRead: false,
      createdAt: new Date()
    });
    
    res.json({ message: "Tradie rejected successfully" });
  } catch (error) {
    console.error("Error rejecting tradie:", error);
    res.status(500).json({ error: "Failed to reject tradie" });
  }
});

export default router;