/**
 * WhatsAppService - NEUTRALIZED FOR TESTING
 * This service has been disabled to prevent server-side crashes on Hostinger.
 * Production will use the Official WhatsApp Business Cloud API.
 */
class WhatsAppService {
    private isConnected = false;
    private isInitializing = false;
    private initStep: string = 'Disabled (Mock Mode)';

    constructor() {
        if (typeof window === 'undefined') {
            console.log('[WhatsApp] Service is currently in MOCK MODE.');
        }
    }

    public async init() {
        console.log('[WhatsApp] Init skipped: Service is disabled in favor of Cloud API transition.');
        return;
    }

    public async sendOTP(phone: string, otp: string) {
        console.log(`[WhatsApp Mock] Would send OTP ${otp} to ${phone}`);
        return true;
    }

    public async sendMessage(phone: string, text: string): Promise<boolean> {
        console.log(`[WhatsApp Mock] Would send message to ${phone}: ${text}`);
        return true;
    }

    public getSocket() {
        return null;
    }

    public async requestPairingCode(phone: string): Promise<string> {
        return "MOCK-CODE";
    }

    public async logout() {
        this.isConnected = false;
    }

    public getLastQR() {
        return {
            qr: null,
            isConnected: false,
            isInitializing: false,
            initStep: 'Service Disabled (Cloud API Transition)',
            lastError: null,
            isReachable: true
        };
    }
}

const globalForWhatsApp = global as unknown as { whatsappService: WhatsAppService | undefined };

export function getWhatsAppService(): WhatsAppService {
    if (!globalForWhatsApp.whatsappService) {
        globalForWhatsApp.whatsappService = new WhatsAppService();
    }
    return globalForWhatsApp.whatsappService;
}
