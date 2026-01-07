import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repairUrls() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
        console.error('BACKEND_URL not defined in environment variables.');
        return;
    }

    console.log(`Starting URL repair using: ${backendUrl}`);

    // 1. Repair Product Images
    const products = await prisma.product.findMany({
        where: {
            imageUrl: {
                contains: 'http://localhost:3001'
            }
        }
    });

    console.log(`Found ${products.length} products with localhost URLs.`);

    for (const product of products) {
        const newUrl = product.imageUrl?.replace('http://localhost:3001', backendUrl);
        await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: newUrl }
        });
    }

    // 2. Repair User Profile Photos
    const users = await prisma.user.findMany({
        where: {
            profilePhoto: {
                contains: 'http://localhost:3001'
            }
        }
    });

    console.log(`Found ${users.length} users with localhost URLs.`);

    for (const user of users) {
        const newUrl = user.profilePhoto?.replace('http://localhost:3001', backendUrl);
        await prisma.user.update({
            where: { id: user.id },
            data: { profilePhoto: newUrl }
        });
    }

    console.log('Repair completed successfully.');
}

repairUrls()
    .catch(e => {
        console.error('Error during repair:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
