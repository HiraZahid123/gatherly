import fs from "fs";
import path from "path";

export interface EventPayoutRecord {
  id: string;
  eventId: string;
  hostId?: string;
  amount: number; // in cents/kobo
  currency: string;
  paymentPlatform: string; // e.g. "Direct Bank Transfer", "Paystack", "Flutterwave", "PayPal", "Stripe", "Cash", "Other"
  reference?: string; // Transaction reference or receipt number
  notes?: string;
  paidAt: string;
  paidBy: string; // Admin who recorded the payout
}

const PAYOUTS_FILE_PATH = path.join(process.cwd(), "data", "event-payouts.json");

let cachedPayouts: EventPayoutRecord[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000;

export function getAllPayoutsSync(): EventPayoutRecord[] {
  const now = Date.now();
  if (cachedPayouts && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedPayouts;
  }

  try {
    if (!fs.existsSync(PAYOUTS_FILE_PATH)) {
      const dir = path.dirname(PAYOUTS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PAYOUTS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
      cachedPayouts = [];
      lastCacheTime = now;
      return cachedPayouts;
    }

    const raw = fs.readFileSync(PAYOUTS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    cachedPayouts = Array.isArray(parsed) ? parsed : [];
    lastCacheTime = now;
    return cachedPayouts;
  } catch (err) {
    console.error("[getAllPayoutsSync] Error reading payouts:", err);
    return [];
  }
}

export async function getAllPayouts(): Promise<EventPayoutRecord[]> {
  return getAllPayoutsSync();
}

export async function getPayoutsForEvent(eventId: string): Promise<EventPayoutRecord[]> {
  const all = await getAllPayouts();
  return all.filter((p) => p.eventId === eventId);
}

export async function recordEventPayout(payout: Omit<EventPayoutRecord, "id" | "paidAt">): Promise<EventPayoutRecord> {
  const all = await getAllPayouts();

  const newRecord: EventPayoutRecord = {
    id: `payout_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...payout,
    paidAt: new Date().toISOString(),
  };

  all.unshift(newRecord);

  const dir = path.dirname(PAYOUTS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(PAYOUTS_FILE_PATH, JSON.stringify(all, null, 2), "utf-8");
  cachedPayouts = all;
  lastCacheTime = Date.now();

  return newRecord;
}

export async function deleteEventPayout(payoutId: string): Promise<boolean> {
  const all = await getAllPayouts();
  const index = all.findIndex((p) => p.id === payoutId);
  if (index === -1) return false;

  all.splice(index, 1);

  const dir = path.dirname(PAYOUTS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(PAYOUTS_FILE_PATH, JSON.stringify(all, null, 2), "utf-8");
  cachedPayouts = all;
  lastCacheTime = Date.now();

  return true;
}
