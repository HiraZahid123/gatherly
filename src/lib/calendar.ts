/**
 * Calendar Utilities for Feature 10
 * Generates links for Google Calendar, Outlook, and ICS (Apple/Desktop)
 */

interface CalendarEvent {
    title: string;
    description?: string;
    location?: string;
    startDate: Date | string;
    endDate?: Date | string;
    url?: string;
}

function formatDate(date: Date | string): string {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().replace(/-|:|\.\d+/g, "");
    } catch (e) {
        return "";
    }
}

/**
 * Escapes characters for ICS fields
 */
function escapeIcsText(text: string = ""): string {
    return text
        .replace(/[\\,;]/g, (match) => `\\${match}`)
        .replace(/\n/g, "\\n");
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
    try {
        const base = "https://www.google.com/calendar/render?action=TEMPLATE";
        const details = event.description ? `&details=${encodeURIComponent(event.description)}` : "";
        const location = event.location ? `&location=${encodeURIComponent(event.location)}` : "";
        const start = formatDate(event.startDate);
        if (!start) return "#";
        const end = event.endDate ? formatDate(event.endDate) : formatDate(new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000));

        return `${base}&text=${encodeURIComponent(event.title)}${details}${location}&dates=${start}/${end}`;
    } catch (e) {
        return "#";
    }
}

export function generateOutlookUrl(event: CalendarEvent): string {
    try {
        const base = "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent";
        const start = new Date(event.startDate).toISOString();
        const end = event.endDate ? new Date(event.endDate).toISOString() : new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString();

        return `${base}&subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(event.location || "")}&startdt=${start}&enddt=${end}`;
    } catch (e) {
        return "#";
    }
}

export function generateIcsData(event: CalendarEvent): string {
    try {
        const start = formatDate(event.startDate);
        if (!start) return "#";
        const end = event.endDate ? formatDate(event.endDate) : formatDate(new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000));
        const now = formatDate(new Date());

        const icsLines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "PRODID:-//Olasunkanmi//Event Platform//EN",
            "BEGIN:VEVENT",
            `UID:${event.title.replace(/\s+/g, "-")}-${Date.now()}@olasunkanmi.com`,
            `DTSTAMP:${now}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${escapeIcsText(event.title)}`,
            event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : "",
            event.location ? `LOCATION:${escapeIcsText(event.location)}` : "",
            "END:VEVENT",
            "END:VCALENDAR"
        ].filter(Boolean);

        return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines.join("\r\n"))}`;
    } catch (e) {
        return "#";
    }
}

export function getCalendarLinks(event: CalendarEvent) {
    return {
        google: generateGoogleCalendarUrl(event),
        outlook: generateOutlookUrl(event),
        ics: generateIcsData(event)
    };
}
