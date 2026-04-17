-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "demand_level" TEXT,
ADD COLUMN     "demand_multiplier" DOUBLE PRECISION,
ADD COLUMN     "scheduled_date" DATE,
ADD COLUMN     "scheduled_time_slot" TEXT;
