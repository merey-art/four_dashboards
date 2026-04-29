-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientServiceOrder" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expectedDelivery" TIMESTAMP(3) NOT NULL,
    "codeIssued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsContainer" (
    "id" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "borderCrossing" TEXT NOT NULL,
    "routeNote" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalContract" (
    "id" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "partyType" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "originalReceived" BOOLEAN NOT NULL DEFAULT false,
    "contractDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingAct" (
    "id" TEXT NOT NULL,
    "counterpartName" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "actKind" TEXT NOT NULL,
    "actDate" TIMESTAMP(3),
    "originalReceived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingAct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
