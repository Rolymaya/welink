/*
  Warnings:

  - You are about to alter the column `type` on the `knowledgebase` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - You are about to drop the column `contentChunk` on the `knowledgevector` table. All the data in the column will be lost.
  - Added the required column `content` to the `KnowledgeVector` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `KnowledgeVector` DROP FOREIGN KEY `KnowledgeVector_knowledgeBaseId_fkey`;

-- AlterTable
ALTER TABLE `KnowledgeBase` ADD COLUMN `errorMessage` TEXT NULL,
    ADD COLUMN `sourceUrl` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'PROCESSING', 'READY', 'ERROR') NOT NULL DEFAULT 'PENDING',
    MODIFY `type` ENUM('FILE', 'URL', 'TEXT') NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE `KnowledgeVector` DROP COLUMN `contentChunk`,
    ADD COLUMN `content` TEXT NOT NULL,
    ADD COLUMN `metadata` JSON NULL;

-- AddForeignKey
ALTER TABLE `KnowledgeVector` ADD CONSTRAINT `KnowledgeVector_knowledgeBaseId_fkey` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `KnowledgeBase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
