-- AlterTable
ALTER TABLE "order_details" ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "meal_type" TEXT,
ADD COLUMN     "property_type" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_created_at_id_idx" ON "audit_logs"("created_at", "id");

-- CreateIndex
CREATE INDEX "orders_created_at_id_idx" ON "orders"("created_at", "id");
