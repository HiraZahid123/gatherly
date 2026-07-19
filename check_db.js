const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const event = await prisma.event.findUnique({ where: { slug: 'ab-test-3gtcgg' } });
    console.log(JSON.stringify(event.theme, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
