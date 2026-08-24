import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp';
import { isAdmin } from '@/lib/admin';

export async function POST() {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    console.log('[API] Force restarting WhatsApp Service...');

    try {
        const service = getWhatsAppService(true);
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
