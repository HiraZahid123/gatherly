import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { fileURLToPath } from 'url';

// ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function resetWhatsApp() {
    console.log('--- WHATSAPP SESSION RESET (via PG) ---');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in .env');
        return;
    }

    const pool = new Pool({ connectionString });

    try {
        const client = await pool.connect();
        try {
            const res = await client.query('DELETE FROM "WhatsAppSession"');
            console.log(`Successfully deleted ${res.rowCount} session records.`);
            console.log('\n--- NEXT STEPS ---');
            console.log('1. Restart your development server: Ctrl+C then "npm run dev"');
            console.log('2. Look for the "--- NEW WHATSAPP QR CODE ---" message in the terminal.');
            console.log('3. Scan the QR code with your phone.');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to reset WhatsApp session:', error);
    } finally {
        await pool.end();
    }
}

resetWhatsApp();
