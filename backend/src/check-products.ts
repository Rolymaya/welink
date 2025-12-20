
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const orgId = 'edc248f5-309c-466a-ad45-1d0e114250af';
    console.log(`Checking products for Org: ${orgId}`);

    const products = await prisma.product.findMany({
        where: { organizationId: orgId }
    });

    console.log(`Found ${products.length} products:`);
    products.forEach(p => {
        console.log(`- ${p.name} (Active: ${p.isActive}, Stock: ${p.stock})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
