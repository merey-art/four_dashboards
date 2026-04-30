-- CreateTable
CREATE TABLE "DashboardBuiltinColumnLabel" (
    "id" TEXT NOT NULL,
    "dashboard" "DashboardKind" NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardBuiltinColumnLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardBuiltinColumnLabel_dashboard_fieldKey_key" ON "DashboardBuiltinColumnLabel"("dashboard", "fieldKey");
