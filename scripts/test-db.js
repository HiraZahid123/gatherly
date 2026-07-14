const { PrismaClient } = require('../src/generated/client');

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing connection to:', connectionString ? connectionString.split('@')[1] : 'UNDEFINED');
  
  try {
    // Test Prisma directly
    console.log('Testing Prisma instance (Native Engine)...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    });
    
    const userCount = await prisma.user.count();
    console.log('Prisma User count:', userCount);
    
    await prisma.$disconnect();
    console.log('Test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

testConnection();
