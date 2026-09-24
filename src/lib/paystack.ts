import crypto from "crypto";
import { getPaystackConfigSync } from "./platformSettings";

export interface InitializePaystackParams {
  email: string;
  amount: number; // in kobo (e.g. 500000 = ₦5,000)
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
  channels?: Array<"card" | "bank" | "ussd" | "qr" | "mobile_money" | "bank_transfer" | "eft">;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number; // in kobo
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    customer: {
      id: number;
      first_name?: string;
      last_name?: string;
      email: string;
      customer_code: string;
      phone?: string;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
    };
  };
}

export interface PaystackRefundParams {
  transaction: string | number; // reference or transaction id
  amount?: number; // in kobo (optional, defaults to full amount)
  merchantNote?: string;
}

export interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    transaction: {
      id: number;
      reference: string;
      amount: number;
      currency: string;
    };
    amount: number;
    status: string;
    id: number;
  };
}

/**
 * Returns effective Paystack secret key
 */
export function getPaystackSecretKey(): string {
  const { secretKey } = getPaystackConfigSync();
  return secretKey || process.env.PAYSTACK_SECRET_KEY || "";
}

/**
 * Returns effective Paystack public key
 */
export function getPaystackPublicKey(): string {
  const { publicKey } = getPaystackConfigSync();
  return publicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
}

/**
 * Initialize a transaction on Paystack
 */
export async function initializePaystackTransaction(
  params: InitializePaystackParams
): Promise<PaystackInitResponse> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error("Paystack secret key is not configured.");
  }

  const payload: Record<string, any> = {
    email: params.email,
    amount: Math.round(params.amount),
    reference: params.reference,
    currency: "NGN",
  };

  if (params.callbackUrl) {
    payload.callback_url = params.callbackUrl;
  }

  if (params.metadata) {
    payload.metadata = params.metadata;
  }

  if (params.channels && params.channels.length > 0) {
    payload.channels = params.channels;
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message || "Failed to initialize Paystack transaction.");
  }

  return json as PaystackInitResponse;
}

/**
 * Verify a transaction on Paystack by reference
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error("Paystack secret key is not configured.");
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message || "Failed to verify Paystack transaction.");
  }

  return json as PaystackVerifyResponse;
}

/**
 * Create a refund on Paystack
 */
export async function createPaystackRefund(
  params: PaystackRefundParams
): Promise<PaystackRefundResponse> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    throw new Error("Paystack secret key is not configured.");
  }

  const payload: Record<string, any> = {
    transaction: params.transaction,
  };

  if (params.amount && params.amount > 0) {
    payload.amount = Math.round(params.amount);
  }

  if (params.merchantNote) {
    payload.merchant_note = params.merchantNote;
  }

  const res = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.status) {
    throw new Error(json.message || "Failed to process Paystack refund.");
  }

  return json as PaystackRefundResponse;
}

/**
 * Verify Paystack webhook event signature
 */
export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;
  const secretKey = getPaystackSecretKey();
  if (!secretKey) return false;

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return hash === signatureHeader;
}
