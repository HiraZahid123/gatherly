const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  const email = 'admin@example.com';
  const password = 'Admin@123';
  const phone = '+1999999999'; // Unique phone number to avoid constraint errors
  const hashedPassword = bcrypt.hashSync(password, 10);
  const connectionString = process.env.DATABASE_URL;

  const client = new Client({ connectionString });

  console.log(`[Admin Creator] Connecting to database...`);

  try {
    await client.connect();
    
    // Check if user exists by email
    const checkRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (checkRes.rows.length > 0) {
      console.log(`[Admin Creator] User exists, updating to ADMIN...`);
      await client.query(
        'UPDATE users SET password = $1, role = $2, name = $3, phone = $4, "emailVerified" = NOW(), "updatedAt" = NOW() WHERE email = $5',
        [hashedPassword, 'ADMIN', 'Super Admin', phone, email]
      );
    } else {
      console.log(`[Admin Creator] Creating new ADMIN user...`);
      const id = 'admin_' + Math.random().toString(36).substr(2, 9);
      // Clean up any existing user with this phone number to avoid conflicts
      await client.query('DELETE FROM users WHERE phone = $1 AND email != $2', [phone, email]);
      
      await client.query(
        'INSERT INTO users (id, name, email, phone, password, role, "emailVerified", "updatedAt", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())',
        [id, 'Super Admin', email, phone, hashedPassword, 'ADMIN']
      );
    }

    console.log(`[Admin Creator] SUCCESS! Admin user ready.`);
    console.log(`[Admin Creator] Credentials:`);
    console.log(`  - Email: ${email}`);
    console.log(`  - Password: ${password}`);
    console.log(`  - Endpoint: /admin/login`);

  } catch (error) {
    console.error(`[Admin Creator] Error:`, error);
  } finally {
    await client.end();
  }
}

main();
