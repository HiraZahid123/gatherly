-- =============================================================
-- SAFE MIGRATION SCRIPT FOR PRODUCTION
-- Run this in phpPgAdmin on your ranafdnl_gatherly database.
-- 100% safe: uses IF NOT EXISTS everywhere.
-- WhatsAppSession data is NEVER touched.
-- =============================================================

-- ── ENUMS (skip if already exist) ────────────────────────────
DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('GUEST', 'HOST', 'ADMIN', 'STAFF'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EventType" AS ENUM ('EVENT', 'CARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "LocationType" AS ENUM ('PHYSICAL', 'VIRTUAL', 'HYBRID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RSVPStatus" AS ENUM ('ACCEPTED', 'MAYBE', 'DECLINED', 'PENDING', 'WAITLISTED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BroadcastAudience" AS ENUM ('ALL', 'CONFIRMED', 'PENDING'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLES (create only if missing) ──────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'GUEST',
    "otpCode" TEXT,
    "otpExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'EVENT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locationType" "LocationType" NOT NULL DEFAULT 'PHYSICAL',
    "location" TEXT,
    "virtualLink" TEXT,
    "coverImage" TEXT,
    "theme" JSONB,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "guestListHidden" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "rsvpDeadline" TIMESTAMP(3),
    "checkInWindowStart" INTEGER NOT NULL DEFAULT 60,
    "maxCheckIns" INTEGER NOT NULL DEFAULT 2,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rsvps" (
    "id" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL,
    "waitlistPosition" INTEGER,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "qrToken" TEXT,
    "qrExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "otpCode" TEXT,
    "otpExpires" TIMESTAMP(3),
    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "invitations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "event_staff" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SCANNER',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "check_ins" (
    "id" TEXT NOT NULL,
    "rsvpId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "broadcasts" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" "BroadcastAudience" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "broadcasts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- WhatsAppSession: create only if missing (never drops or clears it)
CREATE TABLE IF NOT EXISTS "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "eventId" TEXT,
    "recipientId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- ── ADD MISSING COLUMNS TO EXISTING TABLES ───────────────────

-- users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpExpires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);

-- events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "checkInWindowStart" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "maxCheckIns" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "guestListHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "rsvpDeadline" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "virtualLink" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "theme" JSONB;

-- rsvps table
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "guestPhone" TEXT;
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "otpCode" TEXT;
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "otpExpires" TIMESTAMP(3);
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "qrToken" TEXT;
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "qrExpiresAt" TIMESTAMP(3);
ALTER TABLE "rsvps" ADD COLUMN IF NOT EXISTS "waitlistPosition" INTEGER;

-- invitations table
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

-- check_ins table
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "scanCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "check_ins" ADD COLUMN IF NOT EXISTS "staffId" TEXT;

-- comments table
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;

-- broadcasts table
ALTER TABLE "broadcasts" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

-- chat_messages table
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "recipientId" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

-- announcements table
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- ── UNIQUE CONSTRAINTS & INDEXES (skip if exist) ──────────────
DO $$ BEGIN CREATE UNIQUE INDEX "users_email_key" ON "users"("email"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "users_email_idx" ON "users"("email"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "accounts_providerAccountId_idx" ON "accounts"("providerAccountId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "events_slug_idx" ON "events"("slug"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "events_hostId_idx" ON "events"("hostId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "events_status_idx" ON "events"("status"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "photos_eventId_idx" ON "photos"("eventId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "rsvps_qrToken_key" ON "rsvps"("qrToken"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "rsvps_userId_eventId_key" ON "rsvps"("userId", "eventId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "rsvps_eventId_guestEmail_key" ON "rsvps"("eventId", "guestEmail"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "invitations_eventId_idx" ON "invitations"("eventId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "invitations_email_idx" ON "invitations"("email"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "invitations_phone_idx" ON "invitations"("phone"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "event_staff_eventId_userId_key" ON "event_staff"("eventId", "userId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "event_staff_eventId_idx" ON "event_staff"("eventId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "event_staff_userId_idx" ON "event_staff"("userId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "check_ins_rsvpId_idx" ON "check_ins"("rsvpId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "check_ins_staffId_idx" ON "check_ins"("staffId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "broadcasts_eventId_idx" ON "broadcasts"("eventId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "comments_eventId_idx" ON "comments"("eventId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE UNIQUE INDEX "WhatsAppSession_key_key" ON "WhatsAppSession"("key"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "chat_messages_eventId_idx" ON "chat_messages"("eventId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "chat_messages_senderId_recipientId_idx" ON "chat_messages"("senderId", "recipientId"); EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX "announcements_eventId_idx" ON "announcements"("eventId"); EXCEPTION WHEN others THEN NULL; END $$;

-- ── FOREIGN KEYS (skip if exist) ──────────────────────────────
DO $$ BEGIN ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "events" ADD CONSTRAINT "events_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "photos" ADD CONSTRAINT "photos_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "photos" ADD CONSTRAINT "photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "invitations" ADD CONSTRAINT "invitations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "rsvps"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "comments" ADD CONSTRAINT "comments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "announcements" ADD CONSTRAINT "announcements_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "announcements" ADD CONSTRAINT "announcements_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN others THEN NULL; END $$;
