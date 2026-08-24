import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp';
import { purgeWhatsAppSessions } from '@/lib/whatsapp-store';
import { isAdmin } from '@/lib/admin';

export async function POST() {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    try {
        console.log('[API] Manual WhatsApp Logout requested');
        await getWhatsAppService().logout();
        await purgeWhatsAppSessions();
        
        return NextResponse.json({ success: true, message: 'Logged out and purged sessions' });
    } catch (e: any) {
        console.error('[API] Logout Error:', e);
        return NextResponse.json({ error: e.message || 'Failed to logout' }, { status: 500 });
    }
}
