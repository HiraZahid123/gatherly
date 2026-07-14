import { NextResponse } from 'next/server';
import { getWhatsAppService } from '@/services/whatsapp';
import { purgeWhatsAppSessions } from '@/lib/whatsapp-store';

export async function POST() {
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
