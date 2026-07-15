const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reminders = await prisma.eventReminder.findMany();
  console.log("Reminders count:", reminders.length);
  console.log(reminders);
}

main().finally(() => prisma.$disconnect());
