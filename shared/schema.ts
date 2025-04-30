import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").unique(),
  // Updated roles to include project manager
  role: text("role").notNull().default("tradie"), // tradie, project_manager, or supplier
  businessId: integer("business_id").references(() => businesses.id),
  isApproved: boolean("is_approved").default(false), // For approval workflow
  approvedBy: integer("approved_by"), // User who approved this user
  approvalDate: timestamp("approval_date"), // When the user was approved
  createdAt: timestamp("created_at").defaultNow(), // When the user was created
  // For tradie self-registration
  status: text("status").default("unassigned"), // unassigned, pending_invitation, invited, active
  emailVerified: boolean("email_verified").default(false), // Email verification status
  verificationToken: text("verification_token"), // Token for email verification
  tokenExpiry: timestamp("token_expiry"), // Expiry time for verification token
  termsAccepted: boolean("terms_accepted").default(false), // Whether the user has accepted the terms
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  approvalDate: true,
  createdAt: true,
  tokenExpiry: true,
  verificationToken: true,
});

// Businesses table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"), 
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  priceTier: text("price_tier").default("T3"), // T1, T2, or T3
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Clients table (new)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  businessId: integer("business_id").references(() => businesses.id), // Associated business
  address: text("address"), 
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Contacts table (new - for multiple contacts per client)
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: text("position"),
  phone: text("phone"),
  email: text("email"),
  isPrimary: boolean("is_primary").default(false), // Whether this is the primary contact
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

// Parts table - enhanced for contract pricing
export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  item_code: text("item_code").notNull().unique(),
  pipe_size: text("pipe_size").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  category: text("category"), // Additional categorization
  manufacturer: text("manufacturer"),
  supplier_code: text("supplier_code"), // Supplier's internal code
  price_t1: doublePrecision("price_t1").notNull(), // Retail price
  price_t2: doublePrecision("price_t2").notNull(), // Standard discount
  price_t3: doublePrecision("price_t3").notNull(), // Volume discount
  cost_price: doublePrecision("cost_price"), // Internal cost price (only visible to suppliers)
  in_stock: integer("in_stock").default(0),
  min_stock: integer("min_stock").default(0), // Minimum stock threshold
  is_popular: boolean("is_popular").default(false),
  image: text("image"), // URL to the image of the part
  last_ordered: timestamp("last_ordered"), // When the part was last ordered
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertPartSchema = createInsertSchema(parts).omit({
  id: true,
  last_ordered: true,
  created_at: true,
  updated_at: true,
});

// Contract Pricing table (new - for client-specific pricing)
export const contractPricing = pgTable("contract_pricing", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  partId: integer("part_id").references(() => parts.id).notNull(),
  price: doublePrecision("price").notNull(), // Contract-specific price
  effectiveDate: timestamp("effective_date").defaultNow(),
  expiryDate: timestamp("expiry_date"), // When the contract pricing expires
  createdBy: integer("created_by").references(() => users.id),
});

export const insertContractPricingSchema = createInsertSchema(contractPricing).omit({
  id: true,
});

// Jobs table - enhanced for PM assignment
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jobNumber: text("job_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id),
  businessId: integer("business_id").references(() => businesses.id),
  status: text("status").notNull().default("active"), // active, pending, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isPublic: boolean("is_public").default(false), // Whether the job is visible to all contractors
  createdBy: integer("created_by").references(() => users.id), // User who created the job
  projectManagerId: integer("project_manager_id").references(() => users.id), // Assigned PM (new)
  budget: doublePrecision("budget"), // Budget for the job
  startDate: timestamp("start_date"), // Job start date
  endDate: timestamp("end_date"), // Expected completion date
  location: text("location"), // Location/address of the job site
  description: text("description"), // Detailed description of the job
  notes: text("notes"), // Additional notes
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Job Users table (new - for assigning tradies to jobs)
export const jobUsers = pgTable("job_users", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const insertJobUserSchema = createInsertSchema(jobUsers).omit({
  id: true,
  assignedAt: true,
});

// Orders table - modified for order flow
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  clientId: integer("client_id").references(() => clients.id),
  jobId: integer("job_id").references(() => jobs.id),
  status: text("status").notNull().default("pending_approval"), // pending_approval, approved, rejected, processing, shipped, completed
  requestedBy: integer("requested_by").references(() => users.id), // Tradie who requested
  approvedBy: integer("approved_by").references(() => users.id), // PM who approved
  approvalDate: timestamp("approval_date"), // When order was approved
  customerName: text("customer_name"), // Name of person placing the order
  orderNumber: text("order_number"), // Client reference number/PO number
  deliveryAddress: text("delivery_address"), // Where to deliver
  deliveryInstructions: text("delivery_instructions"), // Special delivery instructions
  reqDeliveryDate: timestamp("req_delivery_date"), // Requested delivery date
  notes: text("notes"), // Order notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  approvalDate: true,
  createdAt: true,
  updatedAt: true,
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  partId: integer("part_id").references(() => parts.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  priceAtOrder: doublePrecision("price_at_order").notNull(),
  notes: text("notes"), // Item-specific notes
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Cart items table (temporary storage)
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  partId: integer("part_id").references(() => parts.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"), // Item-specific notes
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
});

// Job Parts table (association between Jobs and Parts)
export const jobParts = pgTable("job_parts", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  partId: integer("part_id").references(() => parts.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  addedBy: integer("added_by").references(() => users.id), // Who added this part to the job
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertJobPartSchema = createInsertSchema(jobParts).omit({
  id: true,
  addedAt: true,
});

// Order History table (for tracking order status changes)
export const orderHistory = pgTable("order_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  status: text("status").notNull(), // Status the order changed to
  notes: text("notes"), // Notes associated with status change
  changedBy: integer("changed_by").references(() => users.id), // User who changed the status
  changedAt: timestamp("changed_at").defaultNow(),
});

export const insertOrderHistorySchema = createInsertSchema(orderHistory).omit({
  id: true,
  changedAt: true,
});

// Notifications table (new)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // User to notify
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // order_request, approval, rejection, user_registration, etc.
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"), // ID of related entity (order, user, etc.)
  relatedType: text("related_type"), // Type of related entity (order, user, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Tradie Invitations table (new)
export const tradieInvitations = pgTable("tradie_invitations", {
  id: serial("id").primaryKey(),
  tradieId: integer("tradie_id").references(() => users.id).notNull(), // Tradie being invited
  projectManagerId: integer("project_manager_id").references(() => users.id).notNull(), // PM sending the invitation
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  email: text("email").notNull(), // Email used for the invitation
  invitationDate: timestamp("invitation_date").defaultNow(),
  responseDate: timestamp("response_date"), // When the tradie responded
  expiryDate: timestamp("expiry_date"), // When the invitation expires
  notes: text("notes"), // Additional notes or message
});

export const insertTradieInvitationSchema = createInsertSchema(tradieInvitations).omit({
  id: true,
  invitationDate: true,
  responseDate: true,
});

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
  approvedByUser: one(users, {
    fields: [users.approvedBy],
    references: [users.id],
  }),
  jobsManaged: many(jobs, { relationName: "projectManager" }),
  jobsAssigned: many(jobUsers),
  ordersRequested: many(orders, { relationName: "requester" }),
  ordersApproved: many(orders, { relationName: "approver" }),
  invitationsReceived: many(tradieInvitations, { relationName: "tradie" }),
  invitationsSent: many(tradieInvitations, { relationName: "projectManager" }),
}));

export const businessesRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  jobs: many(jobs),
  clients: many(clients),
  orders: many(orders),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
  contacts: many(contacts),
  contractPricing: many(contractPricing),
  jobs: many(jobs),
  orders: many(orders),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  client: one(clients, {
    fields: [contacts.clientId],
    references: [clients.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(clients, {
    fields: [jobs.clientId],
    references: [clients.id],
  }),
  business: one(businesses, {
    fields: [jobs.businessId],
    references: [businesses.id],
  }),
  createdByUser: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
  }),
  projectManager: one(users, {
    fields: [jobs.projectManagerId],
    references: [users.id],
    relationName: "projectManager",
  }),
  assignedUsers: many(jobUsers),
  jobParts: many(jobParts),
  orders: many(orders),
}));

export const jobUsersRelations = relations(jobUsers, ({ one }) => ({
  job: one(jobs, {
    fields: [jobUsers.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [jobUsers.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [jobUsers.assignedBy],
    references: [users.id],
  }),
}));

export const partsRelations = relations(parts, ({ many }) => ({
  jobParts: many(jobParts),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  contractPricing: many(contractPricing),
}));

export const contractPricingRelations = relations(contractPricing, ({ one }) => ({
  client: one(clients, {
    fields: [contractPricing.clientId],
    references: [clients.id],
  }),
  part: one(parts, {
    fields: [contractPricing.partId],
    references: [parts.id],
  }),
  createdByUser: one(users, {
    fields: [contractPricing.createdBy],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  business: one(businesses, {
    fields: [orders.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
  }),
  job: one(jobs, {
    fields: [orders.jobId],
    references: [jobs.id],
  }),
  requestedByUser: one(users, {
    fields: [orders.requestedBy],
    references: [users.id],
    relationName: "requester",
  }),
  approvedByUser: one(users, {
    fields: [orders.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
  orderItems: many(orderItems),
  history: many(orderHistory),
}));

export const orderHistoryRelations = relations(orderHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderHistory.orderId],
    references: [orders.id],
  }),
  changedByUser: one(users, {
    fields: [orderHistory.changedBy],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  part: one(parts, {
    fields: [orderItems.partId],
    references: [parts.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  part: one(parts, {
    fields: [cartItems.partId],
    references: [parts.id],
  }),
  job: one(jobs, {
    fields: [cartItems.jobId],
    references: [jobs.id],
  }),
}));

export const jobPartsRelations = relations(jobParts, ({ one }) => ({
  job: one(jobs, {
    fields: [jobParts.jobId],
    references: [jobs.id],
  }),
  part: one(parts, {
    fields: [jobParts.partId],
    references: [parts.id],
  }),
  addedByUser: one(users, {
    fields: [jobParts.addedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const tradieInvitationsRelations = relations(tradieInvitations, ({ one }) => ({
  tradie: one(users, {
    fields: [tradieInvitations.tradieId],
    references: [users.id],
    relationName: "tradie",
  }),
  projectManager: one(users, {
    fields: [tradieInvitations.projectManagerId],
    references: [users.id],
    relationName: "projectManager",
  }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Part = typeof parts.$inferSelect;
export type InsertPart = z.infer<typeof insertPartSchema>;

export type ContractPricing = typeof contractPricing.$inferSelect;
export type InsertContractPricing = z.infer<typeof insertContractPricingSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type JobUser = typeof jobUsers.$inferSelect;
export type InsertJobUser = z.infer<typeof insertJobUserSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type JobPart = typeof jobParts.$inferSelect;
export type InsertJobPart = z.infer<typeof insertJobPartSchema>;

export type OrderHistory = typeof orderHistory.$inferSelect;
export type InsertOrderHistory = z.infer<typeof insertOrderHistorySchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type TradieInvitation = typeof tradieInvitations.$inferSelect;
export type InsertTradieInvitation = z.infer<typeof insertTradieInvitationSchema>;
