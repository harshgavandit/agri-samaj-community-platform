-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionMr" TEXT,
    "descriptionEn" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "areaSqm" REAL,
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
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BusinessCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdvertisementPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "placementType" TEXT NOT NULL,
    "colorType" TEXT NOT NULL DEFAULT 'COLOR',
    "price" REAL NOT NULL,
    "dimensions" TEXT NOT NULL,
    "descriptionMr" TEXT,
    "descriptionEn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdvertisementBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "amount" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'NEFT_RTGS',
    "paymentReference" TEXT,
    "paymentDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminRemarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdvertisementBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdvertisementBooking_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AdvertisementBooking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "AdvertisementPackage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleMr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentMr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'INITIATIVE',
    "eventDate" DATETIME,
    "location" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CensusTracker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enumeratorNo" TEXT NOT NULL,
    "surveyorName" TEXT NOT NULL,
    "divisionName" TEXT NOT NULL,
    "taluka" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'महाराष्ट्र',
    "pincode" TEXT NOT NULL,
    "totalHouses" INTEGER NOT NULL,
    "agriHouses" INTEGER NOT NULL,
    "agriPercentage" REAL NOT NULL,
    "questionnairesReceivedFrom" INTEGER,
    "questionnairesReceivedTo" INTEGER,
    "questionnairesUsed" INTEGER,
    "questionnairesBlank" INTEGER,
    "questionnairesDamaged" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_slug_key" ON "BusinessCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_refNumber_key" ON "BusinessProfile"("refNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisementPackage_code_key" ON "AdvertisementPackage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisementBooking_bookingRef_key" ON "AdvertisementBooking"("bookingRef");

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_slug_key" ON "Announcement"("slug");
