-- CreateEnum
CREATE TYPE "DashboardKind" AS ENUM ('ACCOUNTING', 'LEGAL', 'LOGISTICS', 'CLIENT_SERVICE');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN');

-- CreateTable
CREATE TABLE "DashboardCustomColumn" (
    "id" TEXT NOT NULL,
    "dashboard" "DashboardKind" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "CustomFieldType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardCustomColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardCustomColumn_dashboard_key_key" ON "DashboardCustomColumn"("dashboard", "key");

-- CreateIndex
CREATE INDEX "DashboardCustomColumn_dashboard_sortOrder_idx" ON "DashboardCustomColumn"("dashboard", "sortOrder");

-- AlterTable
ALTER TABLE "AccountingAct" ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "LegalContract" ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "LogisticsContainer" ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "ClientServiceOrder" ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}';
