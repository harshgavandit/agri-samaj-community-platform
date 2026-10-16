-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionMr" TEXT,
    "descriptionEn" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "refNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ownerName" TEXT NOT NULL,
    "ownerNameEn" TEXT,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "ownerEducationSchool" TEXT,
    "ownerEducationVocational" TEXT,
    "businessName" TEXT NOT NULL,
    "businessNameEn" TEXT,
    "brandName" TEXT,
    "categoryId" TEXT NOT NULL,
    "subCategory" TEXT,
    "subCategoryEn" TEXT,
    "productsServices" TEXT NOT NULL,
    "productsServicesEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "establishedYear" INTEGER,
    "businessClassification" TEXT NOT NULL DEFAULT 'TRADER',
    "ownershipType" TEXT NOT NULL DEFAULT 'PROPRIETORSHIP',
    "workNature" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "startedBy" TEXT NOT NULL DEFAULT 'SELF',
    "officeAddress" TEXT NOT NULL,
    "officeAddressEn" TEXT,
    "officeCity" TEXT NOT NULL,
    "officeCityEn" TEXT,
    "officeTaluka" TEXT NOT NULL,
    "officeTalukaEn" TEXT,
    "officeDistrict" TEXT NOT NULL,
    "officeDistrictEn" TEXT,
    "officePincode" TEXT NOT NULL,
    "officePhone" TEXT,
    "factoryAddress" TEXT,
    "factoryCity" TEXT,
    "factoryTaluka" TEXT,
    "factoryDistrict" TEXT,
    "factoryPincode" TEXT,
    "isAddressPublic" BOOLEAN NOT NULL DEFAULT true,
    "premisesOwnership" TEXT NOT NULL DEFAULT 'OWNED',
    "areaSqm" DOUBLE PRECISION,
    "employeeCountFemale" INTEGER DEFAULT 0,
    "employeeCountMale" INTEGER DEFAULT 0,
    "employeeCountTotal" INTEGER DEFAULT 0,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "documentUrl" TEXT,
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisementPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "placementType" TEXT NOT NULL,
    "colorType" TEXT NOT NULL DEFAULT 'COLOR',
    "price" DOUBLE PRECISION NOT NULL,
    "dimensions" TEXT NOT NULL,
    "descriptionMr" TEXT,
    "descriptionEn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisementPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisementBooking" (
    "id" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "userId" TEXT,
    "businessProfileId" TEXT,
    "packageId" TEXT NOT NULL,
    "advertiserName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "adTextContent" TEXT NOT NULL,
    "artworkUrl" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'NEFT_RTGS',
    "paymentReference" TEXT,
    "paymentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisementBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "titleMr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "editionYear" INTEGER NOT NULL,
    "editionType" TEXT NOT NULL DEFAULT 'DIRECTORY',
    "descriptionMr" TEXT,
    "descriptionEn" TEXT,
    "coverImageUrl" TEXT,
    "pdfUrl" TEXT,
    "fileSize" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "titleMr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentMr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'INITIATIVE',
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CensusTracker" (
    "id" TEXT NOT NULL,
    "enumeratorNo" TEXT NOT NULL,
    "surveyorName" TEXT NOT NULL,
    "divisionName" TEXT NOT NULL,
    "taluka" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'महाराष्ट्र',
    "pincode" TEXT NOT NULL,
    "totalHouses" INTEGER NOT NULL,
    "agriHouses" INTEGER NOT NULL,
    "agriPercentage" DOUBLE PRECISION NOT NULL,
    "questionnairesReceivedFrom" INTEGER,
    "questionnairesReceivedTo" INTEGER,
    "questionnairesUsed" INTEGER,
    "questionnairesBlank" INTEGER,
    "questionnairesDamaged" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CensusTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "blobPath" TEXT,
    "isReady" BOOLEAN NOT NULL DEFAULT true,
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_slug_key" ON "BusinessCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_refNumber_key" ON "BusinessProfile"("refNumber");

-- CreateIndex
CREATE INDEX "BusinessProfile_status_createdAt_idx" ON "BusinessProfile"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessProfile_categoryId_status_idx" ON "BusinessProfile"("categoryId", "status");

-- CreateIndex
CREATE INDEX "BusinessProfile_userId_createdAt_idx" ON "BusinessProfile"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisementPackage_code_key" ON "AdvertisementPackage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisementBooking_bookingRef_key" ON "AdvertisementBooking"("bookingRef");

-- CreateIndex
CREATE INDEX "AdvertisementBooking_userId_createdAt_idx" ON "AdvertisementBooking"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdvertisementBooking_paymentStatus_idx" ON "AdvertisementBooking"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_slug_key" ON "Announcement"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_blobPath_key" ON "Upload"("blobPath");

-- CreateIndex
CREATE INDEX "Upload_userId_idx" ON "Upload"("userId");

-- CreateIndex
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementBooking" ADD CONSTRAINT "AdvertisementBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementBooking" ADD CONSTRAINT "AdvertisementBooking_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementBooking" ADD CONSTRAINT "AdvertisementBooking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "AdvertisementPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
