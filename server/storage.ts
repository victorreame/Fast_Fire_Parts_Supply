import { 
  users, type User, type InsertUser,
  businesses, type Business, type InsertBusiness,
  parts, type Part, type InsertPart,
  jobs, type Job, type InsertJob,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  cartItems, type CartItem, type InsertCartItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, asc, gt, lt, like, or, not, isNull } from "drizzle-orm";
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
  createUser(user: InsertUser): Promise<User>;
  
  // Businesses
  getBusiness(id: number): Promise<Business | undefined>;
  getAllBusinesses(): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business | undefined>;
  
  // Parts
  getPart(id: number): Promise<Part | undefined>;
  getPartByItemCode(itemCode: string): Promise<Part | undefined>;
  getAllParts(): Promise<Part[]>;
  getPartsByType(type: string): Promise<Part[]>;
  getPopularParts(limit: number): Promise<Part[]>;
  createPart(part: InsertPart): Promise<Part>;
  updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined>;
  deletePart(id: number): Promise<boolean>;
  
  // Jobs
  getJob(id: number): Promise<Job | undefined>;
  getJobsByBusiness(businessId: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  
  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByBusiness(businessId: number): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Cart Items
  getCartItems(userId: number): Promise<CartItem[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private businesses: Map<number, Business>;
  private parts: Map<number, Part>;
  private jobs: Map<number, Job>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private cartItems: Map<number, CartItem>;
  
  // Session store for authentication
  public sessionStore: session.Store;
  
  private userIdCounter: number = 1;
  private businessIdCounter: number = 1;
  private partIdCounter: number = 1;
  private jobIdCounter: number = 1;
  private orderIdCounter: number = 1;
  private orderItemIdCounter: number = 1;
  private cartItemIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.businesses = new Map();
    this.parts = new Map();
    this.jobs = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.cartItems = new Map();
    
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
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed the database with initial data if it's empty
    this.seedDataIfNeeded();
  }
  
  private async seedDataIfNeeded() {
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
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
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
    const [part] = await db.select().from(parts).where(eq(parts.itemCode, itemCode));
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
  
  async getJobsByBusiness(businessId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.businessId, businessId));
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
}

// Use DatabaseStorage for production
export const storage = new DatabaseStorage();
