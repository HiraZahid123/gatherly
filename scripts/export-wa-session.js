/**
 * Exports the current WhatsApp session from the local DB
 * and outputs a ready-to-run SQL INSERT for production phpPgAdmin.
 */
const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
    const rows = await prisma.whatsAppSession.findMany();

    if (!rows.length) {
        console.log('No session found in local DB. Make sure WhatsApp is connected first.');
        return;
    }

    console.log('\n========= COPY EVERYTHING BELOW INTO phpPgAdmin =========\n');
    console.log('DELETE FROM "WhatsAppSession";\n');

    for (const row of rows) {
        const escapedValue = row.value.replace(/'/g, "''");
        console.log(`INSERT INTO "WhatsAppSession" (id, key, value) VALUES ('${row.id}', '${row.key}', '${escapedValue}');`);
    }

    console.log('\n========= END OF SQL =========\n');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
