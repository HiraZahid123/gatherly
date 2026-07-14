import { prisma } from '@/lib/prisma';

// DYNAMIC REQUIRE to bypass Next.js module load errors on Hostinger
// DYNAMIC IMPORT to bypass Next.js module load errors on Hostinger
const getBaileys = async () => await import('@whiskeysockets/baileys');

/**
 * Custom Prisma-based auth store for Baileys
 */
export async function purgeWhatsAppSessions() {
    console.log('[WhatsAppStore] Purging all sessions from DB...');
    try {
        const model = (prisma as any).whatsAppSession;
        if (model) {
            await model.deleteMany({});
            console.log('[WhatsAppStore] Purge complete.');
        }
    } catch (e) {
        console.error('[WhatsAppStore] Error purging sessions:', e);
    }
}

export async function usePrismaAuth() {
    const getModel = () => {
        const model = (prisma as any).whatsAppSession;
        if (!model) {
            throw new Error('Prisma model "WhatsAppSession" not found. Check if Prisma Client is generated.');
        }
        return model;
    };

    const writeData = async (data: any, key: string) => {
        try {
            const { BufferJSON } = await getBaileys();
            const value = JSON.stringify(data, BufferJSON.replacer);
            const model = getModel();
            await model.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        } catch (error) {
            console.error(`[WhatsAppStore] Failed to write data for key ${key}:`, error);
            throw error; // Propagate to service init
        }
    };

    const readData = async (key: string) => {
        try {
            const model = getModel();
            const result = await model.findUnique({
                where: { key },
            });
            if (!result || !result.value || result.value === 'undefined') return null;
            const { BufferJSON } = await getBaileys();
            return JSON.parse(result.value, BufferJSON.reviver);
        } catch (error) {
            console.error(`[WhatsAppStore] Failed to read data for key ${key}:`, error);
            return null; // For read we can return null to signify fresh start
        }
    };

    const removeData = async (key: string) => {
        try {
            const model = getModel();
            await model.deleteMany({
                where: { key },
            }).catch(() => { });
        } catch (error) { }
    };

    // Initialize creds
    console.log('[WhatsAppStore] Reading creds from DB...');
    let creds: any = await readData('creds');
    if (!creds) {
        console.log('[WhatsAppStore] Fresh creds initialization.');
        const { initAuthCreds } = await getBaileys();
        creds = initAuthCreds();
        await writeData(creds, 'creds');
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type: string, ids: string[]) => {
                    const data: { [id: string]: any } = {};
                    for (const id of ids) {
                        const key = `${type}-${id}`;
                        const value = await readData(key);
                        if (value) data[id] = value;
                    }
                    return data;
                },
                set: async (data: any) => {
                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id];
                            const key = `${type}-${id}`;
                            if (value) {
                                await writeData(value, key);
                            } else {
                                await removeData(key);
                            }
                        }
                    }
                },
            },
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        },
        saveState: async (newState: any) => {
            if (newState?.creds) {
                await writeData(newState.creds, 'creds');
            }
        }
    };
}
