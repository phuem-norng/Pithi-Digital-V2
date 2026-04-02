/*
  Warnings:

  - The `type` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `guests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `design` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `eventId` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the `invitations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `events` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventTypeId` to the `templates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventTypeEnum" AS ENUM ('WEDDING', 'BIRTHDAY', 'HOUSEWARMING', 'MEMORIAL', 'ENGAGEMENT', 'GRADUATION', 'BABY_SHOWER', 'OTHER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "GiftPaymentType" AS ENUM ('CASH', 'KHQR');

-- CreateEnum
CREATE TYPE "GiftCurrencyType" AS ENUM ('USD', 'KHR');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_eventId_fkey";

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_guestId_fkey";

-- DropForeignKey
ALTER TABLE "templates" DROP CONSTRAINT "templates_eventId_fkey";

-- DropIndex
DROP INDEX "guests_email_idx";

-- DropIndex
DROP INDEX "guests_eventId_phone_key";

-- DropIndex
DROP INDEX "templates_eventId_idx";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "address" TEXT,
ADD COLUMN     "coordinates" JSONB,
ADD COLUMN     "eventTypeId" TEXT,
ADD COLUMN     "googleMapLink" TEXT,
ADD COLUMN     "guestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "khqrDollar" TEXT,
ADD COLUMN     "khqrRiel" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "musicUrl" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "templateId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "EventTypeEnum";

-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "adultCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "childrenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "greetingMessage" TEXT,
ADD COLUMN     "group" TEXT DEFAULT 'GROOM_SIDE',
ADD COLUMN     "note" TEXT,
ADD COLUMN     "rsvpStatus" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tableNumber" TEXT,
ADD COLUMN     "tag" TEXT DEFAULT 'OTHERS',
DROP COLUMN "status",
ADD COLUMN     "status" "InvitationStatus";

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "design",
DROP COLUMN "eventId",
ADD COLUMN     "config" JSONB,
ADD COLUMN     "eventTypeId" TEXT NOT NULL,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "thumbnail" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "invitations";

-- DropEnum
DROP TYPE "EventType";

-- DropEnum
DROP TYPE "GuestStatus";

-- CreateTable
CREATE TABLE "event_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "paymentType" "GiftPaymentType" NOT NULL,
    "currencyType" "GiftCurrencyType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_payments" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_types_slug_key" ON "event_types"("slug");

-- CreateIndex
CREATE INDEX "event_types_slug_idx" ON "event_types"("slug");

-- CreateIndex
CREATE INDEX "gifts_eventId_idx" ON "gifts"("eventId");

-- CreateIndex
CREATE INDEX "gifts_guestId_idx" ON "gifts"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "gifts_eventId_guestId_key" ON "gifts"("eventId", "guestId");

-- CreateIndex
CREATE INDEX "expenses_eventId_idx" ON "expenses"("eventId");

-- CreateIndex
CREATE INDEX "expense_payments_expenseId_idx" ON "expense_payments"("expenseId");

-- CreateIndex
CREATE INDEX "expense_payments_paidAt_idx" ON "expense_payments"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_eventTypeId_idx" ON "events"("eventTypeId");

-- CreateIndex
CREATE INDEX "events_templateId_idx" ON "events"("templateId");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "events"("slug");

-- CreateIndex
CREATE INDEX "guests_rsvpStatus_idx" ON "guests"("rsvpStatus");

-- CreateIndex
CREATE INDEX "guests_phone_idx" ON "guests"("phone");

-- CreateIndex
CREATE INDEX "templates_eventTypeId_idx" ON "templates"("eventTypeId");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_payments" ADD CONSTRAINT "expense_payments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
