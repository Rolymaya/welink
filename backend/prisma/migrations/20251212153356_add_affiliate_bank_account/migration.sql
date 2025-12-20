-- AlterTable
ALTER TABLE `affiliateprofile` ADD COLUMN `accountHolder` VARCHAR(191) NULL,
    ADD COLUMN `accountNumber` VARCHAR(191) NULL,
    ADD COLUMN `bankName` VARCHAR(191) NULL,
    ADD COLUMN `iban` VARCHAR(191) NULL,
    ADD COLUMN `swift` VARCHAR(191) NULL;
