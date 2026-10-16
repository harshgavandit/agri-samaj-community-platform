-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Upload_userId_idx" ON "Upload"("userId");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "BusinessProfile_status_createdAt_idx" ON "BusinessProfile"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessProfile_categoryId_status_idx" ON "BusinessProfile"("categoryId", "status");

-- CreateIndex
CREATE INDEX "BusinessProfile_userId_createdAt_idx" ON "BusinessProfile"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdvertisementBooking_userId_createdAt_idx" ON "AdvertisementBooking"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdvertisementBooking_paymentStatus_idx" ON "AdvertisementBooking"("paymentStatus");
