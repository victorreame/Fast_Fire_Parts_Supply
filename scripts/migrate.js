import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTradieInvitationsTable() {
  try {
    const client = await pool.connect();
    
    // Check if the table already exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tradie_invitations')"
    );
    
    if (tableCheck.rows[0].exists) {
      console.log('Table tradie_invitations already exists');
      client.release();
      return;
    }
    
    // Create the tradie_invitations table
    await client.query(`
      CREATE TABLE tradie_invitations (
        id SERIAL PRIMARY KEY,
        project_manager_id INTEGER REFERENCES users(id),
        tradie_id INTEGER REFERENCES users(id),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        invitation_token VARCHAR(255) NOT NULL,
        token_expiry TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        response_date TIMESTAMPTZ,
        UNIQUE(email, project_manager_id)
      )
    `);
    
    console.log('Successfully created tradie_invitations table');
    
    // Update users table if needed
    const columnCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_token')"
    );
    
    if (!columnCheck.rows[0].exists) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN verification_token VARCHAR(255),
        ADD COLUMN token_expiry TIMESTAMPTZ,
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending'
      `);
      console.log('Successfully updated users table with verification fields');
    } else {
      console.log('Users table already has verification fields');
    }
    
    client.release();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error performing migration:', error);
  } finally {
    pool.end();
  }
}

createTradieInvitationsTable();