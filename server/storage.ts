import { 
  users, type User, type InsertUser,
  businesses, type Business, type InsertBusiness,
  parts, type Part, type InsertPart,
  jobs, type Job, type InsertJob,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  cartItems, type CartItem, type InsertCartItem
} from "@shared/schema";

export interface IStorage {
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

export const storage = new MemStorage();
