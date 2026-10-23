-- Add member-owned saved listings without changing existing application records.
CREATE TABLE "SavedBusiness" (
    "userId" TEXT NOT NULL,
    "businessProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedBusiness_pkey" PRIMARY KEY ("userId", "businessProfileId")
);

CREATE INDEX "SavedBusiness_userId_createdAt_idx" ON "SavedBusiness"("userId", "createdAt");
CREATE INDEX "SavedBusiness_businessProfileId_idx" ON "SavedBusiness"("businessProfileId");
ALTER TABLE "SavedBusiness" ADD CONSTRAINT "SavedBusiness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedBusiness" ADD CONSTRAINT "SavedBusiness_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cover common stable directory ordering and administrative review filters.
CREATE INDEX "BusinessProfile_status_createdAt_id_idx" ON "BusinessProfile"("status", "createdAt", "id");
CREATE INDEX "CommunityContent_status_sourceVerified_updatedAt_idx" ON "CommunityContent"("status", "sourceVerified", "updatedAt");
CREATE INDEX "ContactInquiry_status_createdAt_idx" ON "ContactInquiry"("status", "createdAt");
