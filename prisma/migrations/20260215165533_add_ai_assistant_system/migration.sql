-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "aiDailyLimit" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
ADD COLUMN     "aiMonthlyLimit" INTEGER NOT NULL DEFAULT 500;

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT,
    "contractSectionId" TEXT,
    "templateId" TEXT,
    "promptType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "responseTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" INTEGER NOT NULL DEFAULT 0,
    "tone" TEXT,
    "jurisdiction" TEXT,
    "riskPosture" TEXT,
    "clauseType" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_suggestions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT,
    "contractSectionId" TEXT,
    "sectionTitle" TEXT NOT NULL,
    "originalContent" TEXT,
    "suggestedText" TEXT NOT NULL,
    "rationale" TEXT,
    "alternativeShorter" TEXT,
    "alternativeStricter" TEXT,
    "tone" TEXT,
    "jurisdiction" TEXT,
    "riskPosture" TEXT,
    "clauseType" TEXT,
    "model" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_organizationId_idx" ON "ai_usage"("organizationId");

-- CreateIndex
CREATE INDEX "ai_usage_userId_idx" ON "ai_usage"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_createdAt_idx" ON "ai_usage"("createdAt");

-- CreateIndex
CREATE INDEX "ai_suggestions_organizationId_idx" ON "ai_suggestions"("organizationId");

-- CreateIndex
CREATE INDEX "ai_suggestions_userId_idx" ON "ai_suggestions"("userId");

-- CreateIndex
CREATE INDEX "ai_suggestions_contractId_idx" ON "ai_suggestions"("contractId");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
