const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Describing PlaygroundSession table...');
        const result = await prisma.$queryRaw`DESCRIBE PlaygroundSession`;
        console.log(result);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
