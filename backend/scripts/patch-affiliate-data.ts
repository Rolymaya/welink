
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const referralId = '1adeb3e0-37e5-49e2-8020-4e859545036b'; // ID from debug output

    console.log(`Patching referral ${referralId}...`);

    const updated = await prisma.affiliateReferral.update({
        where: { id: referralId },
        data: {
            totalAmount: 50.00
        }
    });

    console.log('Updated referral:', updated);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
