import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp';
import { isAdmin } from '@/lib/admin';

export async function GET() {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const qrData = getWhatsAppService().getLastQR();

    // Auto-init for the scan page if not already doing something
    if (!qrData.qr && !qrData.isConnected && !qrData.isInitializing) {
        console.log('[API] Triggering WhatsApp Service initialization from Scan Page...');
        getWhatsAppService().init();
    }

    return NextResponse.json(qrData);
}
