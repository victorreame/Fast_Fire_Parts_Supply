import { 
  users, type User, type InsertUser,
  businesses, type Business, type InsertBusiness,
  parts, type Part, type InsertPart,
  jobs, type Job, type InsertJob,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  cartItems, type CartItem, type InsertCartItem,
  jobParts, type JobPart, type InsertJobPart,
  clients, type Client, type InsertClient,
  contacts, type Contact, type InsertContact,
  contractPricing, type ContractPricing, type InsertContractPricing,
  jobUsers, type JobUser, type InsertJobUser,
  notifications, type Notification, type InsertNotification,
  orderHistory, type OrderHistory, type InsertOrderHistory,
  tradieInvitations, type TradieInvitation, type InsertTradieInvitation,
  favorites, type InsertFavorite
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, asc, gt, lt, like, or, not, isNull, count } from "drizzle-orm";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByRoleAndApprovalStatus(role: string, isApproved: boolean): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserStatus(userId: number, status: string): Promise<User | undefined>;
  updateUserApproval(userId: number, isApproved: boolean, approvedBy?: number): Promise<User | undefined>;

  // Businesses
  getBusiness(id: number): Promise<Business | undefined>;
  getAllBusinesses(): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business | undefined>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getClientsByBusiness(businessId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Contacts
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByClient(clientId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Parts
  getPart(id: number): Promise<Part | undefined>;
  getPartByItemCode(itemCode: string): Promise<Part | undefined>;
  getAllParts(): Promise<Part[]>;
  getPartsByType(type: string): Promise<Part[]>;
  getPopularParts(limit: number): Promise<Part[]>;
  createPart(part: InsertPart): Promise<Part>;
  updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined>;
  deletePart(id: number): Promise<boolean>;

  // Contract Pricing
  getContractPrice(clientId: number, partId: number): Promise<ContractPricing | undefined>;
  getContractPricesByClient(clientId: number): Promise<ContractPricing[]>;
  createContractPrice(pricing: InsertContractPricing): Promise<ContractPricing>;
  updateContractPrice(id: number, pricing: Partial<InsertContractPricing>): Promise<ContractPricing | undefined>;
  deleteContractPrice(id: number): Promise<boolean>;

  // Jobs
  getJob(id: number): Promise<Job | undefined>;
  getJobByNumber(jobNumber: string): Promise<Job | undefined>;
  getJobsByBusiness(businessId: number): Promise<Job[]>;
  getJobsByClient(clientId: number): Promise<Job[]>;
  getJobsByProjectManager(pmId: number): Promise<Job[]>;
  getPublicJobs(): Promise<Job[]>;
  getJobsByCreator(userId: number): Promise<Job[]>;
  getAllJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // Job Users (assignments)
  getJobUser(id: number): Promise<JobUser | undefined>;
  getJobUsersByJob(jobId: number): Promise<JobUser[]>;
  getJobUsersByUser(userId: number): Promise<JobUser[]>;
  assignUserToJob(jobUser: InsertJobUser): Promise<JobUser>;
  removeUserFromJob(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByBusiness(businessId: number): Promise<Order[]>;
  getOrdersByClient(clientId: number): Promise<Order[]>;
  getOrdersByJob(jobId: number): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByRequestor(userId: number): Promise<Order[]>;
  getOrdersForApproval(projectManagerId: number): Promise<Order[]>;
  getApprovedOrdersByPM(pmId: number, limit?: number): Promise<Order[]>;
  approveOrder(orderId: number, pmId: number, notes: string): Promise<Order>;
  rejectOrder(orderId: number, pmId: number, reason: string): Promise<Order>;
  modifyOrder(orderId: number, pmId: number, updatedItems: { partId: number; quantity: number }[], notes: string): Promise<Order>;
  getOrderHistory(orderId: number): Promise<OrderHistory[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string, approverId?: number): Promise<Order | undefined>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Cart Items
  getCartItems(userId: number): Promise<CartItem[]>;
  getCartItemsByJob(userId: number, jobId: number): Promise<CartItem[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  updateCartItem(id: number, cartItem: Partial<InsertCartItem>): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Job Parts
  getJobParts(jobId: number): Promise<JobPart[]>;
  getJobPartsWithDetails(jobId: number): Promise<(JobPart & { part: Part })[]>;
  addJobPart(jobPart: InsertJobPart): Promise<JobPart>;
  updateJobPartQuantity(id: number, quantity: number): Promise<JobPart | undefined>;
  updateJobPart(id: number, jobPart: Partial<InsertJobPart>): Promise<JobPart | undefined>;
  removeJobPart(id: number): Promise<boolean>;

  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // Tradie Invitations
  getTradieInvitation(id: number): Promise<TradieInvitation | undefined>;
  getTradieInvitationByToken(token: string): Promise<TradieInvitation | undefined>;
  getTradieInvitationsByPM(pmId: number): Promise<TradieInvitation[]>;
  getTradieInvitationsByTradie(tradieId: number): Promise<TradieInvitation[]>;
  getTradieInvitationByEmail(email: string): Promise<TradieInvitation | undefined>;
  getTradieInvitationByEmailAndPM(email: string, pmId: number): Promise<TradieInvitation | undefined>;
  getPendingInvitationsByPM(pmId: number): Promise<TradieInvitation[]>;
  createTradieInvitation(invitation: InsertTradieInvitation): Promise<TradieInvitation>;
  updateTradieInvitationStatus(id: number, status: string, responseDate?: Date): Promise<TradieInvitation | undefined>;
  resendTradieInvitation(id: number, newToken: string, newExpiry: Date): Promise<TradieInvitation | undefined>;
  cancelTradieInvitation(id: number): Promise<TradieInvitation | undefined>;
  acceptTradieInvitation(invitationId: number): Promise<TradieInvitation | undefined>;
  rejectTradieInvitation(invitationId: number): Promise<TradieInvitation | undefined>;
  deleteTradieInvitation(id: number): Promise<boolean>;

  // Favorites
  getFavoritesByUser(userId: number): Promise<{ id: number, userId: number, partId: number }[]>;
  addFavorite(favorite: InsertFavorite): Promise<{ id: number, userId: number, partId: number, addedAt: Date }>;
  removeFavorite(userId: number, partId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private businesses: Map<number, Business>;
  private parts: Map<number, Part>;
  private jobs: Map<number, Job>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private cartItems: Map<number, CartItem>;
  private jobParts: Map<number, JobPart>;

  // Session store for authentication
  public sessionStore: session.Store;

  private userIdCounter: number = 1;
  private businessIdCounter: number = 1;
  private partIdCounter: number = 1;
  private jobIdCounter: number = 1;
  private orderIdCounter: number = 1;
  private orderItemIdCounter: number = 1;
  private cartItemIdCounter: number = 1;
  private jobPartIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.businesses = new Map();
    this.parts = new Map();
    this.jobs = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.cartItems = new Map();
    this.jobParts = new Map();

    // Initialize memory store for sessions
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Add initial data
    this.seedData();
  }

  private seedData() {
    // Seed businesses
    const business1 = this.createBusiness({
      name: "AquaFire Systems",
      address: "123 Main St, Anytown, USA",
      phone: "555-123-4567",
      email: "info@aquafire.com",
      priceTier: "T2"
    });

    const business2 = this.createBusiness({
      name: "SafeGuard Fire Protection",
      address: "456 Oak Ave, Somewhere, USA",
      phone: "555-987-6543",
      email: "contact@safeguardfire.com",
      priceTier: "T1"
    });

    const business3 = this.createBusiness({
      name: "Metro Building Services",
      address: "789 Pine Blvd, Elsewhere, USA",
      phone: "555-456-7890",
      email: "service@metrobuilding.com",
      priceTier: "T3"
    });

    // Seed users
    this.createUser({
      username: "john.doe",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@aquafire.com",
      phone: "555-111-2222",
      role: "contractor",
      businessId: business1.id
    });

    this.createUser({
      username: "jane.smith",
      password: "password123",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@safeguardfire.com",
      phone: "555-333-4444",
      role: "contractor",
      businessId: business2.id
    });

    this.createUser({
      username: "admin",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      email: "admin@fastfire.com",
      phone: "555-555-5555",
      role: "supplier",
      businessId: null
    });

    // Seed parts
    this.createPart({
      itemCode: "VLV-243",
      pipeSize: "2\"",
      description: "Butterfly Valve - Fire Protection",
      type: "Valve",
      priceT1: 68.50,
      priceT2: 65.25,
      priceT3: 62.00,
      inStock: 36,
      isPopular: true
    });

    this.createPart({
      itemCode: "SPK-108",
      pipeSize: "1/2\"",
      description: "Standard Sprinkler Head - K5.6",
      type: "Sprinkler",
      priceT1: 12.99,
      priceT2: 11.75,
      priceT3: 10.50,
      inStock: 122,
      isPopular: true
    });

    this.createPart({
      itemCode: "FIT-432",
      pipeSize: "1\"",
      description: "Threaded Elbow - 90°",
      type: "Fitting",
      priceT1: 3.75,
      priceT2: 3.50,
      priceT3: 3.25,
      inStock: 245,
      isPopular: true
    });

    // Add more parts
    this.createPart({
      itemCode: "PIP-101",
      pipeSize: "1\"",
      description: "Schedule 40 Steel Pipe - 10ft",
      type: "Pipe",
      priceT1: 28.50,
      priceT2: 27.25,
      priceT3: 26.00,
      inStock: 85,
      isPopular: true
    });

    this.createPart({
      itemCode: "FIT-211",
      pipeSize: "3/4\"",
      description: "Threaded Tee",
      type: "Fitting",
      priceT1: 4.25,
      priceT2: 4.00,
      priceT3: 3.75,
      inStock: 180,
      isPopular: true
    });

    // Seed jobs
    this.createJob({
      name: "Office Building Retrofit",
      jobNumber: "JB-2023-142",
      businessId: business1.id,
      status: "active",
      createdAt: new Date("2023-09-15T00:00:00.000Z"),
      updatedAt: new Date("2023-09-15T00:00:00.000Z")
    });

    this.createJob({
      name: "Hotel Construction Project",
      jobNumber: "JB-2023-118",
      businessId: business2.id,
      status: "pending",
      createdAt: new Date("2023-09-10T00:00:00.000Z"),
      updatedAt: new Date("2023-09-10T00:00:00.000Z")
    });

    // Seed orders
    const order1 = this.createOrder({
      businessId: business1.id,
      status: "shipped",
      createdAt: new Date("2023-09-15T00:00:00.000Z"),
      updatedAt: new Date("2023-09-15T00:00:00.000Z")
    });

    const order2 = this.createOrder({
      businessId: business2.id,
      status: "processing",
      createdAt: new Date("2023-09-14T00:00:00.000Z"),
      updatedAt: new Date("2023-09-14T00:00:00.000Z")
    });

    const order3 = this.createOrder({
      businessId: business3.id,
      status: "new",
      createdAt: new Date("2023-09-14T00:00:00.000Z"),
      updatedAt: new Date("2023-09-14T00:00:00.000Z")
    });

    // Seed order items
    const part1 = this.getPartByItemCode("VLV-243");
    const part2 = this.getPartByItemCode("SPK-108");
    const part3 = this.getPartByItemCode("FIT-432");

    if (part1 && order1) {
      this.createOrderItem({
        orderId: order1.id,
        partId: part1.id,
        quantity: 2,
        priceAtOrder: part1.priceT2
      });
    }

    if (part2 && order1) {
      this.createOrderItem({
        orderId: order1.id,
        partId: part2.id,
        quantity: 10,
        priceAtOrder: part2.priceT2
      });
    }

    if (part3 && order2) {
      this.createOrderItem({
        orderId: order2.id,
        partId: part3.id,
        quantity: 8,
        priceAtOrder: part3.priceT1
      });
    }
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserStatus(userId: number, status: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, status };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserApproval(userId: number, isApproved: boolean, approvedBy?: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      isApproved,
      approvedBy: isApproved ? approvedBy : user.approvedBy,
      approvalDate: isApproved ? new Date() : user.approvalDate
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Business Methods
  async getBusiness(id: number): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async getAllBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values());
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const id = this.businessIdCounter++;
    const newBusiness: Business = { ...business, id };
    this.businesses.set(id, newBusiness);
    return newBusiness;
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business | undefined> {
    const existingBusiness = this.businesses.get(id);
    if (!existingBusiness) return undefined;

    const updatedBusiness = { ...existingBusiness, ...business };
    this.businesses.set(id, updatedBusiness);
    return updatedBusiness;
  }

  // Part Methods
  async getPart(id: number): Promise<Part | undefined> {
    return this.parts.get(id);
  }

  async getPartByItemCode(itemCode: string): Promise<Part | undefined> {
    return Array.from(this.parts.values()).find(part => part.itemCode === itemCode);
  }

  async getAllParts(): Promise<Part[]> {
    return Array.from(this.parts.values());
  }

  async getPartsByType(type: string): Promise<Part[]> {
    return Array.from(this.parts.values()).filter(part => part.type === type);
  }

  async getPopularParts(limit: number): Promise<Part[]> {
    return Array.from(this.parts.values())
      .filter(part => part.isPopular)
      .slice(0, limit);
  }

  async createPart(part: InsertPart): Promise<Part> {
    const id = this.partIdCounter++;
    const newPart: Part = { ...part, id };
    this.parts.set(id, newPart);
    return newPart;
  }

  async updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined> {
    const existingPart = this.parts.get(id);
    if (!existingPart) return undefined;

    const updatedPart = { ...existingPart, ...part };
    this.parts.set(id, updatedPart);
    return updatedPart;
  }

  async deletePart(id: number): Promise<boolean> {
    return this.parts.delete(id);
  }

  // Job Methods
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByBusiness(businessId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.businessId === businessId);
  }

  async getPublicJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.isPublic === true);
  }

  async getJobsByCreator(userId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.createdBy === userId);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const newJob: Job = { ...job, id };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const existingJob = this.jobs.get(id);
    if (!existingJob) return undefined;

    const updatedJob = { ...existingJob, ...job, updatedAt: new Date() };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Order Methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByBusiness(businessId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.businessId === businessId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const newOrder: Order = { ...order, id };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;

    const updatedOrder = { ...existingOrder, status, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order Item Methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const newOrderItem: OrderItem = { ...orderItem, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }

  // Cart Item Methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.userId === cartItem.userId && 
             item.partId === cartItem.partId &&
             item.jobId === cartItem.jobId
    );

    if (existingItem) {
      // Update quantity instead of adding new item
      return this.updateCartItemQuantity(existingItem.id, existingItem.quantity + cartItem.quantity);
    }

    const id = this.cartItemIdCounter++;
    const newCartItem: CartItem = { ...cartItem, id };
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const existingItem = this.cartItems.get(id);
    if (!existingItem) return undefined;

    const updatedItem = { ...existingItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: number): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.values()).filter(item => item.userId === userId);

    for (const item of userCartItems) {
      this.cartItems.delete(item.id);
    }

    return true;
  }

  // Job Part Methods
  async getJobParts(jobId: number): Promise<JobPart[]> {
    return Array.from(this.jobParts.values()).filter(item => item.jobId === jobId);
  }

  async getJobPartsWithDetails(jobId: number): Promise<(JobPart & { part: Part })[]> {
    const jobParts = await this.getJobParts(jobId);
    const result: (JobPart & { part: Part })[] = [];

    for (const jobPart of jobParts) {
      const part = await this.getPart(jobPart.partId);
      if (part) {
        result.push({ ...jobPart, part });
      }
    }

    return result;
  }

  async addJobPart(jobPart: InsertJobPart): Promise<JobPart> {
    // Check if part already exists in job
    const existingItem = Array.from(this.jobParts.values()).find(
      item => item.jobId === jobPart.jobId && item.partId === jobPart.partId
    );

    if (existingItem) {
      // Update quantity instead of adding new item
      return this.updateJobPartQuantity(existingItem.id, existingItem.quantity + (jobPart.quantity || 1));
    }

    const id = this.jobPartIdCounter++;
    const newJobPart: JobPart = { 
      ...jobPart, 
      id,
      quantity: jobPart.quantity || 1 
    };
    this.jobParts.set(id, newJobPart);
    return newJobPart;
  }

  async updateJobPartQuantity(id: number, quantity: number): Promise<JobPart | undefined> {
    const existingItem = this.jobParts.get(id);
    if (!existingItem) return undefined;

    const updatedItem = { ...existingItem, quantity };
    this.jobParts.set(id, updatedItem);
    return updatedItem;
  }

  async removeJobPart(id: number): Promise<boolean> {
    return this.jobParts.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Session store for authentication
  public sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // Initialize and seed the database with initial data if needed
  async seedDataIfNeeded() {
    // Check if any users exist
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      console.log("Seeding database with initial data");
      await this.seedData();
    }
  }

  private async seedData() {
    try {
      // Create sample supplier user
      const adminPassword = await hashPassword("admin123");
      const supplierUser = await this.createUser({
        username: "admin",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        email: "admin@fastfire.com",
        phone: "555-555-5555",
        role: "supplier",
        businessId: null
      });

      // Create sample Project Manager user
      const pmPassword = await hashPassword("manager123");
      const pmUser = await this.createUser({
        username: "pm",
        password: pmPassword,
        firstName: "Project",
        lastName: "Manager",
        email: "pm@fastfire.com",
        phone: "555-123-4567",
        role: "project_manager",
        isApproved: true,
        businessId: null
      });

      // Create sample businesses
      const business1 = await this.createBusiness({
        name: "AquaFire Systems",
        address: "123 Main St, Anytown, USA",
        phone: "555-123-4567",
        email: "info@aquafire.com",
        priceTier: "T2"
      });

      const business2 = await this.createBusiness({
        name: "SafeGuard Fire Protection",
        address: "456 Oak Ave, Somewhere, USA",
        phone: "555-987-6543",
        email: "contact@safeguardfire.com",
        priceTier: "T1"
      });

      const business3 = await this.createBusiness({
        name: "Metro Building Services",
        address: "789 Pine Blvd, Elsewhere, USA",
        phone: "555-456-7890",
        email: "service@metrobuilding.com",
        priceTier: "T3"
      });

      // Create contractor users for each business
      const password = await hashPassword("password123");

      await this.createUser({
        username: "john.doe",
        password: password,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@aquafire.com",
        phone: "555-111-2222",
        role: "contractor",
        businessId: business1.id
      });

      await this.createUser({
        username: "jane.smith",
        password: password,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@safeguardfire.com",
        phone: "555-333-4444",
        role: "contractor",
        businessId: business2.id
      });

      // Create sample parts with SVG images
      await this.createPart({
        itemCode: "VLV-243",
        pipeSize: "2\"",
        description: "Butterfly Valve - Fire Protection",
        type: "Valve",
        priceT1: 68.50,
        priceT2: 65.25,
        priceT3: 62.00,
        inStock: 36,
        isPopular: true,
        image: "/assets/parts/VLV-243.svg"
      });

      await this.createPart({
        itemCode: "SPK-567",
        pipeSize: "1/2\"",
        description: "Pendant Sprinkler Head - K5.6",
        type: "Sprinkler",
        priceT1: 12.99,
        priceT2: 11.75,
        priceT3: 10.50,
        inStock: 122,
        isPopular: true,
        image: "/assets/parts/SPK-567.svg"
      });

      await this.createPart({
        itemCode: "FIT-789",
        pipeSize: "1\"",
        description: "Threaded Elbow - 90°",
        type: "Fitting",
        priceT1: 3.75,
        priceT2: 3.50,
        priceT3: 3.25,
        inStock: 245,
        isPopular: true,
        image: "/assets/parts/FIT-789.svg"
      });

      await this.createPart({
        itemCode: "FSW-321",
        pipeSize: "2\"",
        description: "Flow Switch",
        type: "Monitor",
        priceT1: 105.99,
        priceT2: 119.99,
        priceT3: 134.99,
        inStock: 75,
        isPopular: false,
        image: "/assets/parts/FSW-321.svg"
      });

      await this.createPart({
        itemCode: "PGE-654",
        pipeSize: "1/4\"",
        description: "Pressure Gauge",
        type: "Monitor",
        priceT1: 28.50,
        priceT2: 32.99,
        priceT3: 37.99,
        inStock: 120,
        isPopular: true,
        image: "/assets/parts/PGE-654.svg"
      });

      await this.createPart({
        itemCode: "ALP-987",
        pipeSize: "N/A",
        description: "Fire Alarm Pull Station",
        type: "Alarm",
        priceT1: 42.99,
        priceT2: 47.99,
        priceT3: 54.99,
        inStock: 90,
        isPopular: false,
        image: "/assets/parts/ALP-987.svg"
      });

      await this.createPart({
        itemCode: "CPL-135",
        pipeSize: "1\"",
        description: "Pipe Coupling",
        type: "Fitting",
        priceT1: 5.25,
        priceT2: 6.49,
        priceT3: 7.99,
        inStock: 800,
        isPopular: true,
        image: "/assets/parts/CPL-135.svg"
      });

      await this.createPart({
        itemCode: "CHV-246",
        pipeSize: "1-1/2\"",
        description: "Check Valve",
        type: "Valve",
        priceT1: 65.50,
        priceT2: 72.99,
        priceT3: 82.99,
        inStock: 110,
        isPopular: false,
        image: "/assets/parts/CHV-246.svg"
      });

      await this.createPart({
        itemCode: "FDC-159",
        pipeSize: "2-1/2\"",
        description: "Fire Department Connection",
        type: "Connection",
        priceT1: 175.00,
        priceT2: 195.00,
        priceT3: 225.00,
        inStock: 45,
        isPopular: false,
        image: "/assets/parts/FDC-159.svg"
      });

      await this.createPart({
        itemCode: "HSE-753",
        pipeSize: "1-1/2\"",
        description: "Fire Hose",
        type: "Hose",
        priceT1: 95.00,
        priceT2: 105.00,
        priceT3: 125.00,
        inStock: 60,
        isPopular: false,
        image: "/assets/parts/HSE-753.svg"
      });

      // Create Jobs
      const job1 = await this.createJob({
        name: "Office Building Retrofit",
        jobNumber: "JB-2023-142",
        businessId: business1.id,
        status: "active",
        location: "123 Business Ave, Cityville",
        isPublic: true,
        createdBy: 2, // john.doe
        description: "Complete sprinkler system retrofit for office building"
      });

      const job2 = await this.createJob({
        name: "Hotel Construction Project",
        jobNumber: "JB-2023-118",
        businessId: business2.id,
        status: "pending",
        location: "456 Hotel Way, Townshire",
        isPublic: false,
        createdBy: 3, // jane.smith
        description: "New installation for hotel construction"
      });

      // Create Orders
      const order1 = await this.createOrder({
        businessId: business1.id,
        status: "shipped",
        jobId: job1.id,
        customerName: "John Doe",
        orderNumber: "ORD-2023-001"
      });

      const order2 = await this.createOrder({
        businessId: business2.id,
        status: "processing",
        jobId: job2.id,
        customerName: "Jane Smith",
        orderNumber: "ORD-2023-002"
      });

      const order3 = await this.createOrder({
        businessId: business3.id,
        status: "new",
        jobId: null,
        customerName: "Alex Johnson",
        orderNumber: "ORD-2023-003"
      });

      // Get parts for order items
      const part1 = await this.getPartByItemCode("VLV-243");
      const part2 = await this.getPartByItemCode("SPK-567");
      const part3 = await this.getPartByItemCode("FIT-789");

      // Create order items
      if (part1 && order1) {
        await this.createOrderItem({
          orderId: order1.id,
          partId: part1.id,
          quantity: 2,
          priceAtOrder: part1.priceT2
        });
      }

      if (part2 && order1) {
        await this.createOrderItem({
          orderId: order1.id,
          partId: part2.id,
          quantity: 10,
          priceAtOrder: part2.priceT2
        });
      }

      if (part3 && order2) {
        await this.createOrderItem({
          orderId: order2.id,
          partId: part3.id,
          quantity: 8,
          priceAtOrder: part3.priceT1
        });
      }

      console.log("Database successfully seeded with initial data");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getUsersByRoleAndApprovalStatus(role: string, isApproved: boolean): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        eq(users.role, role),
        eq(users.isApproved, isApproved)
      ));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        eq(users.isApproved, false),
        not(eq(users.role, 'supplier')) // Suppliers don't need approval
      ));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Business Methods
  async getBusiness(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async getAllBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses);
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [newBusiness] = await db.insert(businesses).values(business).returning();
    return newBusiness;
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [updatedBusiness] = await db
      .update(businesses)
      .set(business)
      .where(eq(businesses.id, id))
      .returning();
    return updatedBusiness;
  }

  // Part Methods
  async getPart(id: number): Promise<Part | undefined> {
    const [part] = await db.select().from(parts).where(eq(parts.id, id));
    return part;
  }

  async getPartByItemCode(itemCode: string): Promise<Part | undefined> {
    const [part] = await db.select().from(parts).where(eq(parts.item_code, itemCode));
    return part;
  }

  async getAllParts(): Promise<Part[]> {
    return await db.select().from(parts);
  }

  async getPartsByType(type: string): Promise<Part[]> {
    return await db.select().from(parts).where(eq(parts.type, type));
  }

  async getPopularParts(limit: number): Promise<Part[]> {
    return await db
      .select()
      .from(parts)
      .where(eq(parts.isPopular, true))
      .limit(limit);
  }

  async createPart(part: InsertPart): Promise<Part> {
    const [newPart] = await db.insert(parts).values(part).returning();
    return newPart;
  }

  async updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined> {
    const [updatedPart] = await db
      .update(parts)
      .set(part)
      .where(eq(parts.id, id))
      .returning();
    return updatedPart;
  }

  async deletePart(id: number): Promise<boolean> {
    await db.delete(parts).where(eq(parts.id, id));
    return true;
  }

  // Job Methods
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobByNumber(jobNumber: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.jobNumber, jobNumber));
    return job;
  }

  async getJobsByBusiness(businessId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.businessId, businessId));
  }

  async getJobsByProjectManager(projectManagerId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.projectManagerId, projectManagerId));
  }

  async getPublicJobs(): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.isPublic, true));
  }

  async getJobsByCreator(userId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.createdBy, userId));
  }

  async getJobWithDetails(jobId: number): Promise<any> {
    // Get the job
    const job = await this.getJob(jobId);
    if (!job) return null;

    // Get assigned tradies
    const assignedUsers = await this.getJobUsersByJob(jobId);
    const assignedUserDetails = await Promise.all(
      assignedUsers.map(async (assignment) => {
        const user = await this.getUser(assignment.userId);
        return { ...assignment, user };
      })
    );

    // Get associated orders
    const orders = await this.getOrdersByJob(jobId);

    // Get client details if available
    let client = null;
    if (job.clientId) {
      client = await this.getClient(job.clientId);
    }

    // Get business details if available
    let business = null;
    if (job.businessId) {
      business = await this.getBusiness(job.businessId);
    }

    return {
      ...job,
      assignedUsers: assignedUserDetails,
      orders,
      client,
      business
    };
  }

  async getJobsWithStatus(status: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, status));
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async deleteJob(id: number): Promise<boolean> {
    await db.delete(jobs).where(eq(jobs.id, id));
    return true;
  }

  // Order Methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByBusiness(businessId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.businessId, businessId))
      .orderBy(desc(orders.createdAt));
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order Item Methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db
      .insert(orderItems)
      .values(orderItem)
      .returning();
    return newOrderItem;
  }

  // Cart Item Methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  // Job Part Methods
  async getJobParts(jobId: number): Promise<JobPart[]> {
    return await db
      .select()
      .from(jobParts)
      .where(eq(jobParts.jobId, jobId));
  }

  async getJobPartsWithDetails(jobId: number): Promise<(JobPart & { part: Part })[]> {
    const jobPartsList = await this.getJobParts(jobId);
    const result: (JobPart & { part: Part })[] = [];

    for (const jobPart of jobPartsList) {
      const part = await this.getPart(jobPart.partId);
      if (part) {
        result.push({ ...jobPart, part });
      }
    }

    return result;
  }

  async addJobPart(jobPart: InsertJobPart): Promise<JobPart> {
    // Check if part already exists in job
    const [existingJobPart] = await db
      .select()
      .from(jobParts)
      .where(
        and(
          eq(jobParts.jobId, jobPart.jobId),
          eq(jobParts.partId, jobPart.partId)
        )
      );

    if (existingJobPart) {
      // Update quantity instead of adding new item
      return this.updateJobPartQuantity(
        existingJobPart.id, 
        existingJobPart.quantity + (jobPart.quantity || 1)
      );
    }

    const [newJobPart] = await db
      .insert(jobParts)
      .values({
        ...jobPart,
        quantity: jobPart.quantity || 1
      })
      .returning();

    return newJobPart;
  }

  async updateJobPartQuantity(id: number, quantity: number): Promise<JobPart | undefined> {
    const [updatedJobPart] = await db
      .update(jobParts)
      .set({ quantity })
      .where(eq(jobParts.id, id))
      .returning();

    return updatedJobPart;
  }

  async removeJobPart(id: number): Promise<boolean> {
    await db.delete(jobParts).where(eq(jobParts.id, id));
    return true;
  }

  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if the user already has this part in their cart
    const [existingCartItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.partId, cartItem.partId),
          cartItem.jobId ? eq(cartItems.jobId, cartItem.jobId) : isNull(cartItems.jobId)
        )
      );

    if (existingCartItem) {
      // Update quantity instead of adding a new item
      const newQuantity = existingCartItem.quantity + (cartItem.quantity || 1);
      return await this.updateCartItemQuantity(existingCartItem.id, newQuantity);
    }

    const [newCartItem] = await db
      .insert(cartItems)
      .values({
        ...cartItem,
        quantity: cartItem.quantity || 1
      })
      .returning();
    return newCartItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedCartItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedCartItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
    return true;
  }

  async clearCart(userId: number): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return true;
  }

  // Client Methods
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientsByBusiness(businessId: number): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.businessId, businessId));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  // Contact Methods
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactsByClient(clientId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.clientId, clientId));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }

  // Contract Pricing Methods
  async getContractPrice(clientId: number, partId: number): Promise<ContractPricing | undefined> {
    const [price] = await db
      .select()
      .from(contractPricing)
      .where(
        and(
          eq(contractPricing.clientId, clientId),
          eq(contractPricing.partId, partId)
        )
      );
    return price;
  }

  async getContractPricesByClient(clientId: number): Promise<ContractPricing[]> {
    return await db
      .select()
      .from(contractPricing)
      .where(eq(contractPricing.clientId, clientId));
  }

  async createContractPrice(pricing: InsertContractPricing): Promise<ContractPricing> {
    const [newPrice] = await db.insert(contractPricing).values(pricing).returning();
    return newPrice;
  }

  async updateContractPrice(id: number, pricing: Partial<InsertContractPricing>): Promise<ContractPricing | undefined> {
    const [updatedPrice] = await db
      .update(contractPricing)
      .set(pricing)
      .where(eq(contractPricing.id, id))
      .returning();
    return updatedPrice;
  }

  async deleteContractPrice(id: number): Promise<boolean> {
    await db.delete(contractPricing).where(eq(contractPricing.id, id));
    return true;
  }

  // Get jobs by client
  async getJobsByClient(clientId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.clientId, clientId));
  }

  // Get jobs assigned to a user (tradie/contractor)
  async getUserJobs(userId: number): Promise<Job[]> {
    // Get job assignments for this user
    const jobAssignments = await this.getJobUsersByUser(userId);
    const userJobs: Job[] = [];

    // Get job details for each assignment
    for (const assignment of jobAssignments) {
      const job = await this.getJob(assignment.jobId);
      if (job) {
        userJobs.push(job);
      }
    }

    return userJobs;
  }

  // Get orders by user (requestor)
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.requestedBy, userId))
      .orderBy(desc(orders.createdAt));
  }

  // Job User Methods
  async getJobUser(id: number): Promise<JobUser | undefined> {
    const [jobUser] = await db.select().from(jobUsers).where(eq(jobUsers.id, id));
    return jobUser;
  }

  async getJobUsersByJob(jobId: number): Promise<JobUser[]> {
    return await db.select().from(jobUsers).where(eq(jobUsers.jobId, jobId));
  }

  async getJobUsersByUser(userId: number): Promise<JobUser[]> {
    return await db.select().from(jobUsers).where(eq(jobUsers.userId, userId));
  }

  async assignUserToJob(jobUser: InsertJobUser): Promise<JobUser> {
    const [newJobUser] = await db.insert(jobUsers).values(jobUser).returning();
    return newJobUser;
  }

  async removeUserFromJob(id: number): Promise<boolean> {
    await db.delete(jobUsers).where(eq(jobUsers.id, id));
    return true;
  }

  // Additional Order Methods
  async getOrdersByClient(clientId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.clientId, clientId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByJob(jobId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.jobId, jobId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByRequestor(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.requestedBy, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersForApproval(projectManagerId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'pending_approval'),
          // Find orders for jobs where this PM is assigned
          or(
            // Direct PM assignment to job
            eq(orders.jobId, 
              db.select({ id: jobs.id })
                .from(jobs)
                .where(eq(jobs.projectManagerId, projectManagerId))
                .limit(1)
            ),
            // This PM created the job
            eq(orders.jobId, 
              db.select({ id: jobs.id })
                .from(jobs)
                .where(eq(jobs.createdBy, projectManagerId))
                .limit(1)
            )
          )
        )
      )
      .orderBy(desc(orders.createdAt));
  }

  async getApprovedOrdersByPM(pmId: number, limit: number = 30): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.approvedBy, pmId),
          or(
            eq(orders.status, 'approved'),
            eq(orders.status, 'processing'),
            eq(orders.status, 'shipped'),
            eq(orders.status, 'delivered')
          )
        )
      )
      .orderBy(desc(orders.approvalDate))
      .limit(limit);
  }

  async approveOrder(orderId: number, pmId: number, notes: string): Promise<Order> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // 1. Update order status to approved
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'approved',
          approvedBy: pmId,
          approvalDate: new Date(),
          notes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      // 2. Create history record
      await tx
        .insert(orderHistory)
        .values({
          orderId: orderId,
          status: 'approved',
          notes: notes || null,
          changedBy: pmId,
          changedAt: new Date()
        });

      // 3. Create notification for the requestor
      if (updatedOrder.requestedBy) {
        await tx
          .insert(notifications)
          .values({
            userId: updatedOrder.requestedBy,
            type: 'order_approved',
            title: 'Order Approved',
            message: `Your order #${updatedOrder.orderNumber} has been approved.`,
            referenceId: orderId,
            referenceType: 'order'
          });
      }

      return updatedOrder;
    });
  }

  async rejectOrder(orderId: number, pmId: number, reason: string): Promise<Order> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // 1. Update order status to rejected
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'rejected',
          approvedBy: pmId, // For tracking who rejected it
          notes: reason || 'Order rejected',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      // 2. Create history record
      await tx
        .insert(orderHistory)
        .values({
          orderId: orderId,
          status: 'rejected',
          notes: reason || null,
          changedBy: pmId,
          changedAt: new Date()
        });

      // 3. Create notification for the requestor
      if (updatedOrder.requestedBy) {
        await tx
          .insert(notifications)
          .values({
            userId: updatedOrder.requestedBy,
            type: 'order_rejected',
            title: 'Order Rejected',
            message: `Your order #${updatedOrder.orderNumber} has been rejected.`,
            referenceId: orderId,
            referenceType: 'order'
          });
      }

      return updatedOrder;
    });
  }

  async modifyOrder(orderId: number, pmId: number, updatedItems: { partId: number; quantity: number }[], notes: string): Promise<Order> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // 1. Update the order
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'modified',
          notes: notes || 'Order modified by project manager',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error('Order not found');
      }

      // 2. Update quantities for each item
      for (const item of updatedItems) {
        await tx
          .update(orderItems)
          .set({ quantity: item.quantity })
          .where(
            and(
              eq(orderItems.orderId, orderId),
              eq(orderItems.partId, item.partId)
            )
          );
      }

      // 3. Create history record
      await tx
        .insert(orderHistory)
        .values({
          orderId: orderId,
          status: 'modified',
          notes: notes || null,
          changedBy: pmId,
          changedAt: new Date()
        });

      // 4. Create notification for the requestor
      if (updatedOrder.requestedBy) {
        await tx
          .insert(notifications)
          .values({
            userId: updatedOrder.requestedBy,
            type: 'order_modified',
            title: 'Order Modified',
            message: `Your order #${updatedOrder.orderNumber} has been modified and requires your attention.`,
            referenceId: orderId,
            referenceType: 'order'
          });
      }

      return updatedOrder;
    });
  }

  async getOrderHistory(orderId: number): Promise<OrderHistory[]> {
    return await db
      .select()
      .from(orderHistory)
      .where(eq(orderHistory.orderId, orderId))
      .orderBy(desc(orderHistory.changedAt));
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        ...order,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Update order status with optional approver
  async updateOrderStatus(id: number, status: string, approverId?: number): Promise<Order | undefined> {
    const updates: any = { 
      status,
      updatedAt: new Date()
    };

    // If approving an order, record who approved it and when
    if (status === 'approved' && approverId) {
      updates.approvedBy = approverId;
      updates.approvalDate = new Date();
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order Item Methods extensions
  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedOrderItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    await db.delete(orderItems).where(eq(orderItems.id, id));
    return true;
  }

  // Cart additional methods
  async getCartItemsByJob(userId: number, jobId: number): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.jobId, jobId)
        )
      );
  }

  async updateCartItem(id: number, cartItem: Partial<InsertCartItem>): Promise<CartItem | undefined> {
    const [updatedCartItem] = await db
      .update(cartItems)
      .set(cartItem)
      .where(eq(cartItems.id, id))
      .returning();
    return updatedCartItem;
  }

  // Job Part additional methods
  async updateJobPart(id: number, jobPart: Partial<InsertJobPart>): Promise<JobPart | undefined> {
    const [updatedJobPart] = await db
      .update(jobParts)
      .set(jobPart)
      .where(eq(jobParts.id, id))
      .returning();
    return updatedJobPart;
  }

  // Notification Methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    await db.delete(notifications).where(eq(notifications.id, id));
    return true;
  }

  // Tradie Invitation Methods
  async getTradieInvitation(id: number): Promise<TradieInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(tradieInvitations)
      .where(eq(tradieInvitations.id, id));
    return invitation;
  }

  async getTradieInvitationsByPM(pmId: number): Promise<TradieInvitation[]> {
    return db
      .select()
      .from(tradieInvitations)
      .where(eq(tradieInvitations.projectManagerId, pmId));
  }

  async getTradieInvitationsByTradie(tradieId: number): Promise<TradieInvitation[]> {
    return db
      .select()
      .from(tradieInvitations)
      .where(eq(tradieInvitations.tradieId, tradieId));
  }

  async getTradieInvitationByEmail(email: string): Promise<TradieInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(tradieInvitations)
      .where(eq(tradieInvitations.email, email));
    return invitation;
  }

  async getTradieInvitationByEmailAndPM(email: string, pmId: number): Promise<TradieInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(tradieInvitations)
      .where(and(
        eq(tradieInvitations.email, email),
        eq(tradieInvitations.projectManagerId, pmId)
      ));
    return invitation;
  }

  async createTradieInvitation(invitation: InsertTradieInvitation): Promise<TradieInvitation> {
    const [newInvitation] = await db
      .insert(tradieInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async updateTradieInvitationStatus(id: number, status: string, responseDate?: Date): Promise<TradieInvitation | undefined> {
    const updateData: { status: string, responseDate?: Date } = { status };
    if (responseDate) {
      updateData.responseDate = responseDate;
    }

    const [updatedInvitation] = await db
      .update(tradieInvitations)
      .set(updateData)
      .where(eq(tradieInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async getTradieInvitationByToken(token: string): Promise<TradieInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(tradieInvitations)
      .where(eq(tradieInvitations.invitationToken, token));
    return invitation;
  }

  async getPendingInvitationsByPM(pmId: number): Promise<TradieInvitation[]> {
    const results = await db
      .select({
        id: tradieInvitations.id,
        projectManagerId: tradieInvitations.projectManagerId,
        tradieId: tradieInvitations.tradieId,
        email: tradieInvitations.email,
        phone: tradieInvitations.phone,
        invitationToken: tradieInvitations.invitationToken,
        tokenExpiry: tradieInvitations.tokenExpiry,
        status: tradieInvitations.status,
        createdAt: tradieInvitations.createdAt,
        responseDate: tradieInvitations.responseDate,
        personalMessage: tradieInvitations.personalMessage,
      })
      .from(tradieInvitations)
      .where(
        and(
          eq(tradieInvitations.projectManagerId, pmId),
          eq(tradieInvitations.status, 'pending')
        )
      )
      .orderBy(desc(tradieInvitations.createdAt));

    console.log(`Found ${results.length} pending invitations for PM ${pmId}:`, results);
    return results;
  }

  async resendTradieInvitation(id: number, newToken: string, newExpiry: Date): Promise<TradieInvitation | undefined> {
    const [updatedInvitation] = await db
      .update(tradieInvitations)
      .set({ 
        invitationToken: newToken, 
        tokenExpiry: newExpiry,
        status: 'pending'
      })
      .where(eq(tradieInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async cancelTradieInvitation(id: number): Promise<TradieInvitation | undefined> {
    const [updatedInvitation] = await db
      .update(tradieInvitations)
      .set({ status: 'cancelled' })
      .where(eq(tradieInvitations.id, id))
      .returning();
    return updatedInvitation;
  }

  async deleteTradieInvitation(id: number): Promise<boolean> {
    await db
      .delete(tradieInvitations)
      .where(eq(tradieInvitations.id, id));
    return true;
  }

  // User status update
  async updateUserStatus(userId: number, status: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserApproval(userId: number, isApproved: boolean, approvedBy?: number): Promise<User | undefined> {
    const updateData: any = { 
      isApproved,
    };

    // If approving, also set the approval date and approver
    if (isApproved && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvalDate = new Date();
    }

    const [user] = await db
      .update(users)
      .set(updateData)
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

  // Accept tradie invitation
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

  // Reject tradie invitation
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
}

// Use DatabaseStorage for production
export const storage = new DatabaseStorage();