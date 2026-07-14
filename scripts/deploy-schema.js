const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const sql = `
-- Enums (Wrapped in DO blocks for idempotency)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('GUEST', 'HOST', 'ADMIN', 'STAFF');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventType') THEN
        CREATE TYPE "EventType" AS ENUM ('EVENT', 'CARD');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LocationType') THEN
        CREATE TYPE "LocationType" AS ENUM ('PHYSICAL', 'VIRTUAL', 'HYBRID');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventVisibility') THEN
        CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventStatus') THEN
        CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RSVPStatus') THEN
        CREATE TYPE "RSVPStatus" AS ENUM ('ACCEPTED', 'MAYBE', 'DECLINED', 'PENDING');
    END IF;
END $$;

-- Tables
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
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
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
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
    "capacity" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "guestName" TEXT,
    "guestEmail" TEXT,
    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "events_slug_key" ON "events"("slug");
CREATE INDEX IF NOT EXISTS "events_slug_idx" ON "events"("slug");
CREATE INDEX IF NOT EXISTS "events_hostId_idx" ON "events"("hostId");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events"("status");
CREATE INDEX IF NOT EXISTS "photos_eventId_idx" ON "photos"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "rsvps_userId_eventId_key" ON "rsvps"("userId", "eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "rsvps_eventId_guestEmail_key" ON "rsvps"("eventId", "guestEmail");
CREATE INDEX IF NOT EXISTS "comments_eventId_idx" ON "comments"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppSession_key_key" ON "WhatsAppSession"("key");

-- Foreign Keys (Wrapped in DO blocks to avoid errors if already present)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'accounts_userId_fkey') THEN
        ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sessions_userId_fkey') THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'events_hostId_fkey') THEN
        ALTER TABLE "events" ADD CONSTRAINT "events_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'photos_eventId_fkey') THEN
        ALTER TABLE "photos" ADD CONSTRAINT "photos_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'photos_userId_fkey') THEN
        ALTER TABLE "photos" ADD CONSTRAINT "photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'rsvps_userId_fkey') THEN
        ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'rsvps_eventId_fkey') THEN
        ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'comments_eventId_fkey') THEN
        ALTER TABLE "comments" ADD CONSTRAINT "comments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'comments_userId_fkey') THEN
        ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
`;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected! Executing schema (idempotent)...');
    await client.query(sql);
    console.log('Schema deployed successfully!');
  } catch (err) {
    console.error('Deployment failed:', err);
  } finally {
    await client.end();
  }
}

main();
