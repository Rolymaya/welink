-- CreateTable
CREATE TABLE `AffiliateProfile` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `referralCode` VARCHAR(191) NOT NULL,
    `walletBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalEarnings` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AffiliateProfile_organizationId_key`(`organizationId`),
    UNIQUE INDEX `AffiliateProfile_referralCode_key`(`referralCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AffiliateReferral` (
    `id` VARCHAR(191) NOT NULL,
    `referrerId` VARCHAR(191) NOT NULL,
    `referredOrgId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `commissionCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AffiliateReferral_referredOrgId_key`(`referredOrgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AffiliateTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateProfileId` VARCHAR(191) NOT NULL,
    `type` ENUM('COMMISSION_EARNED', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_REJECTED') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'COMPLETED',
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Subscription_status_idx` ON `Subscription`(`status`);

-- CreateIndex
CREATE INDEX `Subscription_endDate_idx` ON `Subscription`(`endDate`);

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `AffiliateProfile` ADD CONSTRAINT `AffiliateProfile_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliateReferral` ADD CONSTRAINT `AffiliateReferral_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `AffiliateProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliateReferral` ADD CONSTRAINT `AffiliateReferral_referredOrgId_fkey` FOREIGN KEY (`referredOrgId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliateTransaction` ADD CONSTRAINT `AffiliateTransaction_affiliateProfileId_fkey` FOREIGN KEY (`affiliateProfileId`) REFERENCES `AffiliateProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `subscription` RENAME INDEX `Subscription_organizationId_fkey` TO `Subscription_organizationId_idx`;

-- RenameIndex
ALTER TABLE `subscription` RENAME INDEX `Subscription_packageId_fkey` TO `Subscription_packageId_idx`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_organizationId_fkey` TO `User_organizationId_idx`;
