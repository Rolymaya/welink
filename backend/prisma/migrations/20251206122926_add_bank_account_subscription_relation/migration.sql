-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `BankAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
