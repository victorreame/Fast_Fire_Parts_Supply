import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("contractor"), // contractor or supplier
  businessId: integer("business_id").references(() => businesses.id),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Businesses table
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  priceTier: text("price_tier").default("T3"), // T1, T2, or T3
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
});

// Parts table
export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  item_code: text("item_code").notNull().unique(),
  pipe_size: text("pipe_size").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  price_t1: doublePrecision("price_t1").notNull(),
  price_t2: doublePrecision("price_t2").notNull(),
  price_t3: doublePrecision("price_t3").notNull(),
  in_stock: integer("in_stock").default(0),
  is_popular: boolean("is_popular").default(false),
  image: text("image"), // URL to the image of the part
});

export const insertPartSchema = createInsertSchema(parts).omit({
  id: true,
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jobNumber: text("job_number").notNull().unique(),
  businessId: integer("business_id").references(() => businesses.id),
  status: text("status").notNull().default("active"), // active, pending, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isPublic: boolean("is_public").default(false), // Whether the job is visible to all contractors
  createdBy: integer("created_by").references(() => users.id), // User who created the job (supplier)
  location: text("location"), // Location of the job
  description: text("description"), // Detailed description of the job
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  status: text("status").notNull().default("new"), // new, processing, shipped, completed
  customerName: text("customer_name"), // Name of person placing the order
  orderNumber: text("order_number"), // Client reference number/PO number
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
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
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

export type Part = typeof parts.$inferSelect;
export type InsertPart = z.infer<typeof insertPartSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
