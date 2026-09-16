import Stripe from "stripe";
import { getStripeConfigSync } from "./platformSettings";

let cachedStripeInstance: Stripe | null = null;
let lastUsedSecretKey: string | null = null;

/**
 * Returns a Stripe client initialized with the current active platform secret key.
 */
export function getStripeClient(): Stripe {
  const { secretKey } = getStripeConfigSync();
  const effectiveKey = secretKey || process.env.STRIPE_SECRET_KEY || "dummy_stripe_secret_key";

  if (!cachedStripeInstance || lastUsedSecretKey !== effectiveKey) {
    cachedStripeInstance = new Stripe(effectiveKey, {
      apiVersion: "2026-04-22.dahlia",
    });
    lastUsedSecretKey = effectiveKey;
  }
  return cachedStripeInstance;
}

/**
 * Transparent proxy so all existing calls like `stripe.paymentIntents.create` or `stripe.accounts`
 * dynamically route to the Stripe client configured with the active secret key.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    const instance = getStripeClient();
    const value = (instance as any)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export const PLATFORM_FEE_PERCENT = 0.03;
