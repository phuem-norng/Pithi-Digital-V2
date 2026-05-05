-- CreateTable
CREATE TABLE "support_links" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_links_isActive_sortOrder_idx" ON "support_links"("isActive", "sortOrder");
