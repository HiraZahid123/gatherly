import http from 'k6/http';
import { check } from 'k6';

const baseUrl = (__ENV.BASE_URL || '').replace(/\/$/, '');
const eventId = __ENV.EVENT_ID;
const eventSlug = __ENV.EVENT_SLUG;
const virtualUsers = Number(__ENV.VUS || 100);

if (!baseUrl || !eventId || !eventSlug) {
    throw new Error('Set BASE_URL, EVENT_ID, and EVENT_SLUG.');
}

if (__ENV.STAGING_CONFIRM !== 'YES') {
    throw new Error('Use an isolated staging environment and set STAGING_CONFIRM=YES.');
}

const hostname = new URL(baseUrl).hostname.toLowerCase();
if (hostname === 'jollywitme.com' || hostname === 'www.jollywitme.com') {
    throw new Error('Production host is blocked. Point BASE_URL at staging.');
}

export const options = {
    scenarios: {
        rsvp_burst: {
            executor: 'per-vu-iterations',
            vus: virtualUsers,
            iterations: 1,
            maxDuration: '10m',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<2000'],
        checks: ['rate>0.99'],
    },
};

export default function () {
    const pageResponse = http.get(`${baseUrl}/e/${eventSlug}`);
    check(pageResponse, {
        'event page returns 200': (response) => response.status === 200,
    });

    const phone = `+1${String(__VU).padStart(10, '0')}`;
    const rsvpResponse = http.post(
        `${baseUrl}/api/events/${eventId}/rsvp`,
        JSON.stringify({
            status: 'ACCEPTED',
            guestName: `Load Test ${__VU}`,
            guestPhone: phone,
            captchaToken: 'load-test',
        }),
        { headers: { 'Content-Type': 'application/json' } },
    );

    check(rsvpResponse, {
        'RSVP succeeds': (response) => response.status === 200 && response.json('success') === true,
    });
}