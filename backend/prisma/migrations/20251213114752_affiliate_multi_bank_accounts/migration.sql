/*
  Warnings:

  - You are about to drop the column `accountHolder` on the `affiliateprofile` table. All the data in the column will be lost.
  - You are about to drop the column `accountNumber` on the `affiliateprofile` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `affiliateprofile` table. All the data in the column will be lost.
  - You are about to drop the column `iban` on the `affiliateprofile` table. All the data in the column will be lost.
  - You are about to drop the column `swift` on the `affiliateprofile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `affiliateprofile` DROP COLUMN `accountHolder`,
    DROP COLUMN `accountNumber`,
    DROP COLUMN `bankName`,
    DROP COLUMN `iban`,
    DROP COLUMN `swift`;

-- CreateTable
CREATE TABLE `AffiliateBankAccount` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateProfileId` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountHolder` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `iban` VARCHAR(191) NULL,
    `swift` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AffiliateBankAccount` ADD CONSTRAINT `AffiliateBankAccount_affiliateProfileId_fkey` FOREIGN KEY (`affiliateProfileId`) REFERENCES `AffiliateProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
