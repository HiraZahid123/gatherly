require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Database Cleanup Started ---');
  
  try {
    // 1. Delete dependent relations first
    console.log('-> Clearing RSVPs...');
    await prisma.rSVP.deleteMany();
    
    console.log('-> Clearing Comments...');
    await prisma.comment.deleteMany();
    
    console.log('-> Clearing Photos...');
    await prisma.photo.deleteMany();
    
    // 2. Delete Events
    console.log('-> Clearing Events...');
    await prisma.event.deleteMany();
    
    // 3. Delete User-related auth data
    console.log('-> Clearing Accounts...');
    await prisma.account.deleteMany();
    
    console.log('-> Clearing Sessions...');
    await prisma.session.deleteMany();
    
    console.log('-> Clearing Verification Tokens...');
    await prisma.verificationToken.deleteMany();
    
    // 4. Delete Users
    console.log('-> Clearing Users...');
    await prisma.user.deleteMany();

    console.log('\n--- Cleanup Completed Successfully ---');
    console.log('NOTE: WhatsAppSession table was PRESERVED.');
    
    const userCount = await prisma.user.count();
    const wsCount = await prisma.whatsAppSession.count();
    console.log(`Summary: Users: ${userCount}, WhatsApp Sessions: ${wsCount}`);

  } catch (error) {
    console.error('\n!!! Cleanup failed:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
