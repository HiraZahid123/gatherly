import { usePrismaAuth, purgeWhatsAppSessions } from '@/lib/whatsapp-store';
import { Boom } from '@hapi/boom';
import pino from 'pino';

// Dynamic import for Baileys to ensure Next.js build compatibility
const getBaileys = async () => await import('@whiskeysockets/baileys');

class WhatsAppService {
    private sock: any = null;
    private isConnected: boolean = false;
    private isInitializing: boolean = false;
    private initStep: string = 'Idle';
    private lastQR: string | null = null;
    private lastError: string | null = null;
    private initPromise: Promise<void> | null = null;

    constructor() {
        if (typeof window === 'undefined') {
            console.log('[WhatsAppService] Initialized singleton.');
        }
    }

    public async init(): Promise<void> {
        if (this.isConnected) {
            console.log('[WhatsAppService] Already connected.');
            return;
        }

        if (this.isInitializing && this.initPromise) {
            console.log('[WhatsAppService] Initialization already in progress, returning existing promise.');
            return this.initPromise;
        }

        this.isInitializing = true;
        this.initStep = 'Starting initialization';
        this.lastError = null;

        this.initPromise = (async () => {
            try {
                const {
                    makeWASocket,
                    DisconnectReason,
                    fetchLatestBaileysVersion,
                } = await getBaileys();

                this.initStep = 'Loading session from DB';
                console.log('[WhatsAppService] Loading auth state from DB...');
                const { state, saveCreds } = await usePrismaAuth();

                this.initStep = 'Fetching latest WhatsApp version';
                let version = [2, 3000, 1015901307];
                try {
                    const versionInfo = await fetchLatestBaileysVersion();
                    if (versionInfo?.version) {
                        version = versionInfo.version;
                    }
                } catch {
                    console.log('[WhatsAppService] Using fallback Baileys version.');
                }

                this.initStep = 'Creating WhatsApp socket';
                console.log('[WhatsAppService] Creating WASocket...');

                this.sock = makeWASocket({
                    version: version as any,
                    auth: state,
                    logger: pino({ level: 'silent' }),
                    printQRInTerminal: true,
                    browser: ['JollyWitMe', 'Chrome', '1.0.0'],
                    connectTimeoutMs: 60000,
                    defaultQueryTimeoutMs: 60000,
                    keepAliveIntervalMs: 25000,
                    generateHighQualityLinkPreview: false,
                    syncFullHistory: false,
                });

                this.sock.ev.on('creds.update', saveCreds);

                this.sock.ev.on('connection.update', async (update: any) => {
                    const { connection, lastDisconnect, qr } = update;

                    if (qr) {
                        console.log('[WhatsAppService] New QR code generated.');
                        this.lastQR = qr;
                        this.initStep = 'QR code ready for scanning';
                    }

                    if (connection === 'close') {
                        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
                        const shouldReconnect = !isLoggedOut;

                        console.log(
                            `[WhatsAppService] Connection closed. Status: ${statusCode}, Reason: ${lastDisconnect?.error?.message}, Reconnecting: ${shouldReconnect}`
                        );

                        this.isConnected = false;
                        this.isInitializing = false;
                        this.sock = null;

                        if (isLoggedOut) {
                            console.log('[WhatsAppService] Device logged out. Purging stored credentials...');
                            this.lastQR = null;
                            this.initStep = 'Logged out. Scan QR to reconnect.';
                            await purgeWhatsAppSessions();
                        } else if (shouldReconnect) {
                            this.initStep = 'Reconnecting...';
                            setTimeout(() => {
                                this.init();
                            }, 5000);
                        }
                    } else if (connection === 'open') {
                        console.log('[WhatsAppService] Connection established successfully! 🎉');
                        this.isConnected = true;
                        this.isInitializing = false;
                        this.lastQR = null;
                        this.lastError = null;
                        this.initStep = 'Connected';
                    }
                });

                this.initStep = 'Socket created, waiting for connection';
            } catch (err: any) {
                console.error('[WhatsAppService] Init failed:', err);
                this.isInitializing = false;
                this.lastError = err?.message || 'Initialization failed';
                this.initStep = `Error: ${this.lastError}`;
                throw err;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    public async sendOTP(phone: string, otp: string): Promise<boolean> {
        const message = `🎉 *Your JollyWitMe Verification Code*\n\nYour 6-digit code is: *${otp}*\n\n_This code will expire in 5 minutes. Please do not share it with anyone._`;
        return this.sendMessage(phone, message);
    }

    public async sendMessage(phone: string, text: string): Promise<boolean> {
        try {
            if (!this.sock || !this.isConnected) {
                console.warn('[WhatsAppService] Cannot send message: Socket not connected. Trying to initialize...');
                await this.init();

                // Wait up to 5s if connecting
                let retries = 0;
                while (!this.isConnected && retries < 10) {
                    await new Promise((r) => setTimeout(r, 500));
                    retries++;
                }

                if (!this.sock || !this.isConnected) {
                    console.error('[WhatsAppService] WhatsApp socket still not connected. Message not sent.');
                    return false;
                }
            }

            // Sanitize phone number to standard WhatsApp JID format
            const cleanDigits = phone.replace(/\D/g, '').replace(/^0+/, '');
            const jid = `${cleanDigits}@s.whatsapp.net`;

            console.log(`[WhatsAppService] Sending WhatsApp message to ${jid}...`);
            await this.sock.sendMessage(jid, { text });
            console.log(`[WhatsAppService] Message sent successfully to ${jid}!`);
            return true;
        } catch (error: any) {
            console.error('[WhatsAppService] Failed to send WhatsApp message:', error);
            return false;
        }
    }

    public async requestPairingCode(phone: string): Promise<string> {
        const cleanDigits = phone.replace(/\D/g, '').replace(/^0+/, '');
        if (!cleanDigits) {
            throw new Error('Invalid phone number for pairing. Please include country code (e.g. +923164904321).');
        }

        if (!this.sock) {
            await this.init();
        }

        // Wait for socket to be ready
        let retries = 0;
        while (!this.sock && retries < 10) {
            await new Promise((r) => setTimeout(r, 500));
            retries++;
        }

        if (!this.sock || typeof this.sock.requestPairingCode !== 'function') {
            throw new Error('WhatsApp service is initializing. Please wait a few seconds and try again.');
        }

        console.log(`[WhatsAppService] Requesting pairing code for phone ${cleanDigits}...`);
        try {
            const code = await this.sock.requestPairingCode(cleanDigits);
            return code;
        } catch (err: any) {
            console.error('[WhatsAppService] requestPairingCode initial attempt error:', err);
            // Re-init and retry once
            await this.init();
            await new Promise((r) => setTimeout(r, 1500));
            if (this.sock?.requestPairingCode) {
                const code = await this.sock.requestPairingCode(cleanDigits);
                return code;
            }
            throw new Error(err?.message || 'Connection closed. Please scan the QR code instead.');
        }
    }

    public async logout(): Promise<void> {
        console.log('[WhatsAppService] Logging out...');
        try {
            if (this.sock) {
                await this.sock.logout().catch(() => {});
                this.sock.end(undefined);
            }
        } catch (e) {
            console.error('[WhatsAppService] Error during socket logout:', e);
        } finally {
            this.sock = null;
            this.isConnected = false;
            this.isInitializing = false;
            this.lastQR = null;
            this.initStep = 'Logged out';
        }
    }

    public getSocket() {
        return this.sock;
    }

    public getLastQR() {
        return {
            qr: this.lastQR,
            isConnected: this.isConnected,
            isInitializing: this.isInitializing,
            initStep: this.initStep,
            lastError: this.lastError,
            isReachable: true,
        };
    }
}

const globalForWhatsApp = global as unknown as { whatsappService: WhatsAppService | undefined };

export function getWhatsAppService(forceNew: boolean = false): WhatsAppService {
    if (forceNew || !globalForWhatsApp.whatsappService || (globalForWhatsApp.whatsappService as any).initStep?.includes('Disabled')) {
        globalForWhatsApp.whatsappService = new WhatsAppService();
    }
    return globalForWhatsApp.whatsappService;
}
