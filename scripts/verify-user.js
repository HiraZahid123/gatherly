const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'hassanjamal9986@gmail.com';
  const dummyPhone = '+1234567890';

  console.log(`[Verify Script] Updating user: ${email}...`);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        phone: dummyPhone,
        emailVerified: new Date(),
        otpCode: null,
        otpExpires: null,
      },
      create: {
        email,
        name: 'Hassan Jamal (Tester)',
        phone: dummyPhone,
        emailVerified: new Date(),
        role: 'ADMIN', // Ensuring they have admin rights for testing if needed
      }
    });

    console.log(`[Verify Script] Success! User updated/created with ID: ${user.id}`);
    console.log(`[Verify Script] Details:`, {
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      role: user.role
    });

  } catch (error) {
    console.error(`[Verify Script] Error updating user:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
