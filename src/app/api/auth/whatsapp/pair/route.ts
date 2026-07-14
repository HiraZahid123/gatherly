import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        const service = getWhatsAppService();

        // Initialize if not already running
        await service.init();

        // Wait up to 10 seconds for the socket to be attached
        let retries = 0;
        let socket = service.getSocket();
        
        while (!socket && retries < 20) {
            await new Promise(r => setTimeout(r, 500));
            socket = service.getSocket();
            retries++;
        }

        if (!socket) {
            return NextResponse.json({ error: 'WhatsApp service failed to initialize socket in time. Please try restarting.' }, { status: 500 });
        }

        const code = await service.requestPairingCode(phone);
        
        return NextResponse.json({ code });
    } catch (e: any) {
        console.error('[API] WhatsApp Pair Error:', e);
        return NextResponse.json({ error: e.message || 'Failed to request pairing code' }, { status: 500 });
    }
}
