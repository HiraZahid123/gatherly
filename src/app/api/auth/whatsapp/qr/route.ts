import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp';

export async function GET() {
    const qrData = getWhatsAppService().getLastQR();

    // Auto-init for the scan page if not already doing something
    if (!qrData.qr && !qrData.isConnected && !qrData.isInitializing) {
        console.log('[API] Triggering WhatsApp Service initialization from Scan Page...');
        getWhatsAppService().init();
    }

    return NextResponse.json(qrData);
}
