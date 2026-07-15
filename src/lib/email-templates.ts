export function getReminderEmailHtml(eventTitle: string, eventUrl: string, startDate: Date, location: string, customMessage?: string | null) {
    const formattedDate = new Date(startDate).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #eaeaea;">
        <div style="background: #000000; padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${eventTitle} is coming up!</h1>
        </div>
        <div style="padding: 32px 24px; color: #333333;">
            <p style="font-size: 16px; line-height: 1.5; margin-top: 0;">This is a quick reminder about your upcoming event.</p>
            
            ${customMessage ? `
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #000;">
                <p style="margin: 0; font-size: 15px; font-style: italic;">"${customMessage}"</p>
            </div>
            ` : ''}
            
            <div style="margin: 32px 0;">
                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888888; margin: 0 0 8px 0;">When</h3>
                <p style="margin: 0; font-size: 16px; font-weight: 600;">${formattedDate}</p>
            </div>
            
            ${location ? `
            <div style="margin: 32px 0;">
                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888888; margin: 0 0 8px 0;">Where</h3>
                <p style="margin: 0; font-size: 16px; font-weight: 600;">${location}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 48px;">
                <a href="${eventUrl}" style="display: inline-block; background: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 99px; font-weight: bold; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">View Event Details</a>
            </div>
        </div>
        <div style="background: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #eaeaea;">
            <p style="margin: 0; font-size: 12px; color: #888888;">Powered by Event Platform</p>
        </div>
    </div>
    `;
}
