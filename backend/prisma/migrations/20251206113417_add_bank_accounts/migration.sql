-- AlterTable
ALTER TABLE `PlaygroundSession` MODIFY `qrCode` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `bankAccountId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `BankAccount` (
    `id` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountHolder` VARCHAR(191) NOT NULL,
    `iban` VARCHAR(191) NOT NULL,
    `swift` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
