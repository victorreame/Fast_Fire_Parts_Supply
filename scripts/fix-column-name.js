import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixColumnName() {
  try {
    const client = await pool.connect();
    
    // Check if the column already exists
    const columnCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified')"
    );
    
    if (!columnCheck.rows[0].exists) {
      // Check if the is_email_verified column exists
      const oldColumnCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_email_verified')"
      );
      
      if (oldColumnCheck.rows[0].exists) {
        // Rename the column
        await client.query(`
          ALTER TABLE users 
          RENAME COLUMN is_email_verified TO email_verified
        `);
        console.log('Successfully renamed column from is_email_verified to email_verified');
      } else {
        // Add the column if it doesn't exist
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
        `);
        console.log('Added email_verified column');
      }
    } else {
      console.log('Column email_verified already exists');
    }
    
    client.release();
    console.log('Fix completed successfully');
  } catch (error) {
    console.error('Error fixing column name:', error);
  } finally {
    pool.end();
  }
}

fixColumnName();