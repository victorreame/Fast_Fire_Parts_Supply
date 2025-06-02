import { db } from './db.ts';
import { notifications, jobs, users, businesses } from '../shared/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';

interface JobNotificationData {
  jobId: number;
  jobName: string;
  jobNumber: string;
  triggeredBy: number;
  businessId: number;
}

interface TradieAssignmentData extends JobNotificationData {
  tradieId: number;
  tradieName: string;
}

interface OrderNotificationData extends JobNotificationData {
  orderId: number;
  orderNumber: string;
  amount?: number;
}

interface JobStatusChangeData extends JobNotificationData {
  oldStatus: string;
  newStatus: string;
}

export class JobNotificationService {
  
  // Create notification for PM when tradie is assigned to job
  async notifyTradieAssigned(data: TradieAssignmentData) {
    const job = await db.select().from(jobs).where(eq(jobs.id, data.jobId)).limit(1);
    if (!job[0] || !job[0].projectManagerId) return;

    await db.insert(notifications).values({
      userId: job[0].projectManagerId,
      title: `Tradie Assigned to ${data.jobName}`,
      message: `${data.tradieName} has been assigned to job ${data.jobNumber}. They can now access job details and place orders.`,
      type: 'job_tradie_assigned',
      relatedId: data.jobId,
      relatedType: 'job'
    });
  }

  // Create notification for tradie when assigned to new job
  async notifyTradieOfAssignment(data: TradieAssignmentData) {
    await db.insert(notifications).values({
      userId: data.tradieId,
      title: `Assigned to New Job: ${data.jobName}`,
      message: `You've been assigned to job ${data.jobNumber}. You can now search for parts and place orders for this job.`,
      type: 'job_assignment_received',
      relatedId: data.jobId,
      relatedType: 'job'
    });
  }

  // Create notification for PM when parts order is requested for job
  async notifyJobOrderRequest(data: OrderNotificationData) {
    const job = await db.select().from(jobs).where(eq(jobs.id, data.jobId)).limit(1);
    if (!job[0] || !job[0].projectManagerId) return;

    const amountText = data.amount ? ` totaling $${data.amount.toFixed(2)}` : '';
    
    await db.insert(notifications).values({
      userId: job[0].projectManagerId,
      title: `Parts Order Request for ${data.jobName}`,
      message: `Order ${data.orderNumber} has been submitted for job ${data.jobNumber}${amountText}. Review and approve the order.`,
      type: 'job_order_request',
      relatedId: data.orderId,
      relatedType: 'order'
    });
  }

  // Create notification for tradie when job order is approved/rejected
  async notifyJobOrderStatus(data: OrderNotificationData & { status: 'approved' | 'rejected', rejectionReason?: string }) {
    const order = await db.query.orders.findFirst({
      where: eq(db.orders.id, data.orderId),
      with: { user: true }
    });
    
    if (!order || !order.requestedBy) return;

    const statusText = data.status === 'approved' ? 'approved' : 'rejected';
    const message = data.status === 'approved' 
      ? `Your parts order ${data.orderNumber} for job ${data.jobNumber} has been approved and will be processed.`
      : `Your parts order ${data.orderNumber} for job ${data.jobNumber} has been rejected. ${data.rejectionReason || 'Please contact your project manager for details.'}`;

    await db.insert(notifications).values({
      userId: order.requestedBy,
      title: `Job Order ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}: ${data.jobName}`,
      message,
      type: `job_order_${data.status}`,
      relatedId: data.orderId,
      relatedType: 'order'
    });
  }

  // Create notification when parts are delivered to job site
  async notifyJobDelivery(data: OrderNotificationData) {
    // Notify PM
    const job = await db.select().from(jobs).where(eq(jobs.id, data.jobId)).limit(1);
    if (job[0]?.projectManagerId) {
      await db.insert(notifications).values({
        userId: job[0].projectManagerId,
        title: `Parts Delivered to ${data.jobName}`,
        message: `Order ${data.orderNumber} has been delivered to the job site for ${data.jobNumber}.`,
        type: 'job_delivery_pm',
        relatedId: data.orderId,
        relatedType: 'order'
      });
    }

    // Notify all assigned tradies
    const assignedTradies = await db.query.jobUsers.findMany({
      where: eq(db.jobUsers.jobId, data.jobId),
      with: { user: true }
    });

    for (const assignment of assignedTradies) {
      await db.insert(notifications).values({
        userId: assignment.userId,
        title: `Parts Delivered: ${data.jobName}`,
        message: `Order ${data.orderNumber} has been delivered to the job site. Parts are now available for installation.`,
        type: 'job_delivery_tradie',
        relatedId: data.orderId,
        relatedType: 'order'
      });
    }
  }

  // Create notification when job status changes
  async notifyJobStatusChange(data: JobStatusChangeData) {
    // Notify PM
    const job = await db.select().from(jobs).where(eq(jobs.id, data.jobId)).limit(1);
    if (job[0]?.projectManagerId) {
      await db.insert(notifications).values({
        userId: job[0].projectManagerId,
        title: `Job Status Updated: ${data.jobName}`,
        message: `Job ${data.jobNumber} status changed from ${data.oldStatus} to ${data.newStatus}.`,
        type: 'job_status_change_pm',
        relatedId: data.jobId,
        relatedType: 'job'
      });
    }

    // Notify all assigned tradies
    const assignedTradies = await db.query.jobUsers.findMany({
      where: eq(db.jobUsers.jobId, data.jobId),
      with: { user: true }
    });

    for (const assignment of assignedTradies) {
      let message = '';
      if (data.newStatus === 'active') {
        message = `Job ${data.jobNumber} is now active. You can continue working and placing parts orders.`;
      } else if (data.newStatus === 'on_hold') {
        message = `Job ${data.jobNumber} has been put on hold. Please contact your project manager for updates.`;
      } else if (data.newStatus === 'completed') {
        message = `Job ${data.jobNumber} has been marked as completed. Thank you for your work on this project.`;
      } else {
        message = `Job ${data.jobNumber} status has been updated to ${data.newStatus}.`;
      }

      await db.insert(notifications).values({
        userId: assignment.userId,
        title: `Job Status Updated: ${data.jobName}`,
        message,
        type: 'job_status_change_tradie',
        relatedId: data.jobId,
        relatedType: 'job'
      });
    }
  }

  // Create notifications for suppliers about new jobs
  async notifySupplierNewJob(data: JobNotificationData) {
    // Get all supplier users
    const suppliers = await db.select().from(users).where(eq(users.role, 'supplier'));
    
    for (const supplier of suppliers) {
      await db.insert(notifications).values({
        userId: supplier.id,
        title: `New Job Created: ${data.jobName}`,
        message: `A new job ${data.jobNumber} has been created and may generate parts orders. Monitor inventory levels for potential demand.`,
        type: 'job_created_supplier',
        relatedId: data.jobId,
        relatedType: 'job'
      });
    }
  }

  // Create notifications for large job orders requiring attention
  async notifySupplierLargeJobOrder(data: OrderNotificationData & { itemCount: number }) {
    const suppliers = await db.select().from(users).where(eq(users.role, 'supplier'));
    
    for (const supplier of suppliers) {
      await db.insert(notifications).values({
        userId: supplier.id,
        title: `Large Job Order: ${data.jobName}`,
        message: `Order ${data.orderNumber} for job ${data.jobNumber} contains ${data.itemCount} items${data.amount ? ` totaling $${data.amount.toFixed(2)}` : ''}. Review inventory and processing priority.`,
        type: 'job_large_order_supplier',
        relatedId: data.orderId,
        relatedType: 'order'
      });
    }
  }

  // Create notification when job is completed
  async notifyJobCompletion(data: JobNotificationData & { completionDate: Date }) {
    // Notify suppliers
    const suppliers = await db.select().from(users).where(eq(users.role, 'supplier'));
    
    for (const supplier of suppliers) {
      await db.insert(notifications).values({
        userId: supplier.id,
        title: `Job Completed: ${data.jobName}`,
        message: `Job ${data.jobNumber} has been completed. Review final order history and update inventory forecasting.`,
        type: 'job_completed_supplier',
        relatedId: data.jobId,
        relatedType: 'job'
      });
    }

    // Notify PM
    const job = await db.select().from(jobs).where(eq(jobs.id, data.jobId)).limit(1);
    if (job[0]?.projectManagerId) {
      await db.insert(notifications).values({
        userId: job[0].projectManagerId,
        title: `Job Completed: ${data.jobName}`,
        message: `Job ${data.jobNumber} has been successfully completed. Review final reports and close any remaining tasks.`,
        type: 'job_completed_pm',
        relatedId: data.jobId,
        relatedType: 'job'
      });
    }
  }

  // Create notification for inventory alerts related to specific jobs
  async notifyJobInventoryAlert(data: JobNotificationData & { partName: string, currentStock: number }) {
    const suppliers = await db.select().from(users).where(eq(users.role, 'supplier'));
    
    for (const supplier of suppliers) {
      await db.insert(notifications).values({
        userId: supplier.id,
        title: `Job Inventory Alert: ${data.partName}`,
        message: `Low stock alert for ${data.partName} (${data.currentStock} remaining) which is needed for active job ${data.jobNumber}.`,
        type: 'job_inventory_alert',
        relatedId: data.jobId,
        relatedType: 'job'
      });
    }
  }

  // Batch create notifications for multiple users
  async batchNotify(notifications: Array<{
    userId: number;
    title: string;
    message: string;
    type: string;
    relatedId?: number;
    relatedType?: string;
  }>) {
    if (notifications.length === 0) return;
    
    await db.insert(db.notifications).values(notifications);
  }
}

export const jobNotificationService = new JobNotificationService();