import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function addPMUser() {
  try {
    // Check if PM user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'pm'),
    });
    
    if (existingUser) {
      console.log('PM user already exists');
      process.exit(0);
    }
    
    // Create PM user
    const pmPassword = await hashPassword('manager123');
    
    await db.insert(users).values({
      username: 'pm',
      password: pmPassword,
      firstName: 'Project',
      lastName: 'Manager',
      email: 'pm@fastfire.com',
      phone: '555-123-4567',
      role: 'project_manager',
      isApproved: true,
      businessId: null
    });
    
    console.log('PM user created successfully');
  } catch (error) {
    console.error('Error creating PM user:', error);
  } finally {
    process.exit(0);
  }
}

addPMUser();