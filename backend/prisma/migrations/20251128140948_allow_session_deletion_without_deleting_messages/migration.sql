-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_sessionId_fkey`;

-- AlterTable
ALTER TABLE `Agent` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Message` MODIFY `sessionId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Organization` MODIFY `logo` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `Session` MODIFY `qrCode` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `profilePhoto` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `Agenda` (
    `id` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `client` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `summary` TEXT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agenda` ADD CONSTRAINT `Agenda_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agenda` ADD CONSTRAINT `Agenda_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
