import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addTermsAcceptedColumn() {
  try {
    const client = await pool.connect();
    
    // Check if the column already exists
    const columnCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'terms_accepted')"
    );
    
    if (!columnCheck.rows[0].exists) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE
      `);
      console.log('Successfully added terms_accepted column');
    } else {
      console.log('Column terms_accepted already exists');
    }
    
    client.release();
    console.log('Fix completed successfully');
  } catch (error) {
    console.error('Error adding terms_accepted column:', error);
  } finally {
    pool.end();
  }
}

addTermsAcceptedColumn();