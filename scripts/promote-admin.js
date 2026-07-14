const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promote() {
  const email = 'hassanjamal9986@gmail.com';
  
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });

  console.log(`SUCCESS: ${user.name} (${user.email}) has been promoted to ADMIN.`);
  console.log(`Access the panel at: /admin/login`);
}

promote().catch(console.error).finally(() => prisma.$disconnect());
