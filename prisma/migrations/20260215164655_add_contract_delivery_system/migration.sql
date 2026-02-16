-- CreateEnum
CREATE TYPE "ContractEventType" AS ENUM ('CREATED', 'SENT', 'RESENT', 'VIEWED', 'DOWNLOADED', 'CANCELLED', 'RECALLED', 'COMPLETED', 'EXPIRED', 'SIGNED', 'DECLINED');

-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'VIEWED';

-- CreateTable
CREATE TABLE "contract_recipients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "contractId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accessTokenHash" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_deliveries" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'EMAIL',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentBy" TEXT NOT NULL,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "emailProvider" TEXT,
    "emailMessageId" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "bouncedAt" TIMESTAMP(3),
    "bouncedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_events" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "recipientId" TEXT,
    "eventType" "ContractEventType" NOT NULL,
    "eventData" JSONB,
    "description" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_recipients_accessToken_key" ON "contract_recipients"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "contract_recipients_accessTokenHash_key" ON "contract_recipients"("accessTokenHash");

-- CreateIndex
CREATE INDEX "contract_recipients_contractId_idx" ON "contract_recipients"("contractId");

-- CreateIndex
CREATE INDEX "contract_recipients_email_idx" ON "contract_recipients"("email");

-- CreateIndex
CREATE INDEX "contract_recipients_accessToken_idx" ON "contract_recipients"("accessToken");

-- CreateIndex
CREATE INDEX "contract_deliveries_contractId_idx" ON "contract_deliveries"("contractId");

-- CreateIndex
CREATE INDEX "contract_deliveries_recipientId_idx" ON "contract_deliveries"("recipientId");

-- CreateIndex
CREATE INDEX "contract_deliveries_sentAt_idx" ON "contract_deliveries"("sentAt");

-- CreateIndex
CREATE INDEX "contract_events_contractId_idx" ON "contract_events"("contractId");

-- CreateIndex
CREATE INDEX "contract_events_recipientId_idx" ON "contract_events"("recipientId");

-- CreateIndex
CREATE INDEX "contract_events_eventType_idx" ON "contract_events"("eventType");

-- CreateIndex
CREATE INDEX "contract_events_createdAt_idx" ON "contract_events"("createdAt");

-- AddForeignKey
ALTER TABLE "contract_recipients" ADD CONSTRAINT "contract_recipients_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_deliveries" ADD CONSTRAINT "contract_deliveries_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_deliveries" ADD CONSTRAINT "contract_deliveries_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "contract_recipients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "contract_recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
