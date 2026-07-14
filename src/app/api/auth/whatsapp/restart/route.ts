import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp';

export async function POST() {
    console.log('[API] Force restarting WhatsApp Service...');

    try {
        const service = getWhatsAppService();
        await service.logout();
        await service.init();

        return NextResponse.json({
            success: true,
            message: 'WhatsApp Service restarted. Please check the scan page.'
        });
    } catch (error: any) {
        console.error('[API] Force restart failed:', error);
        return NextResponse.json({
            success: false,
            error: error?.message || 'Failed to restart service'
        }, { status: 500 });
    }
}
