import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export interface UserPermissions {
  canViewPricing: boolean;
  canPlaceOrders: boolean;
  canViewCompanyJobs: boolean;
  canSearchByJobNumber: boolean;
  canAccessCart: boolean;
  canManageCompany: boolean;
  accessLevel: 'independent' | 'approved' | 'limited' | 'pm';
  companyId?: number;
}

export class AccessControl {
  // Get user permissions based on role and company status
  static async getUserPermissions(userId: number): Promise<UserPermissions> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const basePermissions: UserPermissions = {
      canViewPricing: false,
      canPlaceOrders: false,
      canViewCompanyJobs: false,
      canSearchByJobNumber: false,
      canAccessCart: false,
      canManageCompany: false,
      accessLevel: 'independent'
    };

    // PM permissions
    if (user.role === 'project_manager') {
      return {
        ...basePermissions,
        canViewPricing: true,
        canPlaceOrders: true,
        canViewCompanyJobs: true,
        canSearchByJobNumber: true,
        canAccessCart: true,
        canManageCompany: true,
        accessLevel: 'pm',
        companyId: user.businessId || undefined
      };
    }

    // Tradie permissions based on company status
    if (user.role === 'tradie') {
      // Independent tradie (no company or own business)
      if (!user.businessId || !user.isApproved) {
        return {
          ...basePermissions,
          accessLevel: user.businessId && !user.isApproved ? 'limited' : 'independent'
        };
      }

      // Company-approved tradie
      if (user.businessId && user.isApproved) {
        return {
          ...basePermissions,
          canPlaceOrders: true,
          canViewCompanyJobs: true,
          canSearchByJobNumber: true,
          canAccessCart: true,
          accessLevel: 'approved',
          companyId: user.businessId
        };
      }
    }

    return basePermissions;
  }

  // Check if user can access specific company data
  static async canAccessCompanyData(userId: number, companyId: number): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;

    // PMs can access their own company data
    if (user.role === 'project_manager' && user.businessId === companyId) {
      return true;
    }

    // Approved tradies can access their company data
    if (user.role === 'tradie' && user.businessId === companyId && user.isApproved) {
      return true;
    }

    return false;
  }

  // Check if user can place orders
  static async canPlaceOrders(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.canPlaceOrders;
  }

  // Check if user can view pricing
  static async canViewPricing(userId: number): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.canViewPricing;
  }

  // Check if PM can manage specific tradie
  static async canManageTradie(pmId: number, tradieId: number): Promise<boolean> {
    const pm = await storage.getUser(pmId);
    const tradie = await storage.getUser(tradieId);

    if (!pm || !tradie) return false;
    if (pm.role !== 'project_manager') return false;
    if (!pm.businessId) return false;

    // PM can manage tradies in their company
    return tradie.businessId === pm.businessId;
  }

  // Check if tradie can access specific job
  static async canAccessJob(userId: number, jobId: number): Promise<boolean> {
    const user = await storage.getUser(userId);
    const job = await storage.getJob(jobId);

    if (!user || !job) return false;

    // PMs can access their company jobs
    if (user.role === 'project_manager' && user.businessId === job.businessId) {
      return true;
    }

    // Approved tradies can access their company jobs
    if (user.role === 'tradie' && user.businessId === job.businessId && user.isApproved) {
      return true;
    }

    return false;
  }

  // Validate invitation permissions
  static async canSendInvitation(pmId: number, email: string): Promise<{ canSend: boolean; reason?: string }> {
    const pm = await storage.getUser(pmId);
    if (!pm || pm.role !== 'project_manager') {
      return { canSend: false, reason: 'Only project managers can send invitations' };
    }

    if (!pm.businessId) {
      return { canSend: false, reason: 'Project manager must be associated with a company' };
    }

    // Check for existing pending invitation
    const existingInvitation = await storage.getTradieInvitationByEmail(email);
    if (existingInvitation && existingInvitation.projectManagerId === pmId && existingInvitation.status === 'pending') {
      return { canSend: false, reason: 'A pending invitation already exists for this email' };
    }

    // Check if user already exists and is in the company
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser && existingUser.businessId === pm.businessId && existingUser.isApproved) {
      return { canSend: false, reason: 'User is already an approved member of your company' };
    }

    return { canSend: true };
  }

  // Filter parts data based on user permissions
  static async filterPartsData(userId: number, parts: any[]): Promise<any[]> {
    const permissions = await this.getUserPermissions(userId);

    return parts.map(part => {
      const filteredPart = { ...part };

      // Remove pricing for non-PM users
      if (!permissions.canViewPricing) {
        delete filteredPart.price;
        delete filteredPart.cost;
        delete filteredPart.margin;
        delete filteredPart.contractPrice;
      }

      return filteredPart;
    });
  }

  // Filter jobs data based on user permissions
  static async filterJobsData(userId: number, jobs: any[]): Promise<any[]> {
    const user = await storage.getUser(userId);
    if (!user) return [];

    return jobs.filter(job => {
      // PMs see their company jobs
      if (user.role === 'project_manager' && user.businessId === job.businessId) {
        return true;
      }

      // Approved tradies see their company jobs
      if (user.role === 'tradie' && user.businessId === job.businessId && user.isApproved) {
        return true;
      }

      return false;
    });
  }

  // Check rate limiting for invitations
  static async checkInvitationRateLimit(pmId: number): Promise<{ allowed: boolean; reason?: string }> {
    const pm = await storage.getUser(pmId);
    if (!pm) return { allowed: false, reason: 'User not found' };

    // Get invitations sent in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInvitations = await storage.getPendingInvitationsByPM(pmId);
    const recentCount = recentInvitations.filter(inv => new Date(inv.createdAt) > oneDayAgo).length;

    const MAX_INVITATIONS_PER_DAY = 50;
    if (recentCount >= MAX_INVITATIONS_PER_DAY) {
      return { allowed: false, reason: `Maximum ${MAX_INVITATIONS_PER_DAY} invitations per day exceeded` };
    }

    return { allowed: true };
  }
}

// Middleware functions
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

export const requirePM = requireRole(['project_manager']);
export const requireTradie = requireRole(['tradie']);
export const requireApprovedTradie = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!req.user || req.user.role !== 'tradie') {
    return res.status(403).json({ message: "Tradie role required" });
  }

  if (!req.user.businessId || !req.user.isApproved) {
    return res.status(403).json({ 
      message: "Company membership and approval required",
      accessLevel: req.user.businessId ? 'limited' : 'independent'
    });
  }

  next();
};

export const requireCompanyAccess = (getCompanyId: (req: Request) => number | undefined) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ message: "Company ID required" });
    }

    const hasAccess = await AccessControl.canAccessCompanyData(req.user!.id, companyId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Company access required" });
    }

    next();
  };
};

export const validateJobAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const jobId = parseInt(req.params.jobId);
  if (isNaN(jobId)) {
    return res.status(400).json({ message: "Valid job ID required" });
  }

  const hasAccess = await AccessControl.canAccessJob(req.user!.id, jobId);
  if (!hasAccess) {
    return res.status(403).json({ message: "Job access denied" });
  }

  next();
};

export const requireOrderPermissions = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const canPlaceOrders = await AccessControl.canPlaceOrders(req.user!.id);
  if (!canPlaceOrders) {
    const permissions = await AccessControl.getUserPermissions(req.user!.id);
    return res.status(403).json({ 
      message: "Order placement not allowed for your current access level",
      accessLevel: permissions.accessLevel,
      reason: permissions.accessLevel === 'independent' 
        ? 'Join a company to place orders'
        : permissions.accessLevel === 'limited'
        ? 'Your company access has been limited'
        : 'Insufficient permissions'
    });
  }

  next();
};