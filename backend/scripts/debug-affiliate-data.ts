
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching Affiliate Referrals...');
    const referrals = await prisma.affiliateReferral.findMany({
        include: {
            referred: true,
            referrer: true,
        }
    });

    console.log(`Found ${referrals.length} referrals.`);

    for (const r of referrals) {
        console.log('------------------------------------------------');
        console.log(`ID: ${r.id}`);
        console.log(`Referred Org: ${r.referred.name} (${r.referredOrgId})`);
        console.log(`Referrer: ${r.referrer.referralCode}`);
        console.log(`Commission Count: ${r.commissionCount}`);
        console.log(`Total Amount (Decimal): ${r.totalAmount}`);
        console.log(`Total Amount (toNumber): ${r.totalAmount.toNumber()}`);

        // Also check transactions for this referrer
        const transactions = await prisma.affiliateTransaction.findMany({
            where: { affiliateProfileId: r.referrerId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log('Recent Transactions for Referrer:');
        transactions.forEach(t => {
            console.log(`  - ${t.type}: ${t.amount} (Status: ${t.status}) - ${t.description}`);
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
