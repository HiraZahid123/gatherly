const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const email = 'hassanjamal9986@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, role: true, password: true }
  });
  console.log('Admin Candidate Status:', JSON.stringify(user, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
