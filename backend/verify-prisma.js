const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing PlaygroundSession creation...');

        // We won't actually create one to avoid foreign key constraints issues with random IDs,
        // but we'll check if the type definition allows these fields by attempting a count with a where clause using the new fields.
        // Actually, let's try to create one but expect it to fail on foreign keys, but NOT on "Unknown argument".

        // Better yet, let's just inspect the dmmf (data model meta format) if possible, or just try a simple query.

        // Let's try to find a session with a specific status. If the client doesn't know 'status', it will throw "Unknown argument".
        const count = await prisma.playgroundSession.count({
            where: {
                status: 'QR_READY'
            }
        });

        console.log('✅ Success! Prisma Client recognizes "status" field.');
        console.log('Count:', count);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('Unknown argument')) {
            console.error('⚠️ DIAGNOSIS: Prisma Client is OUT OF SYNC with Schema.');
        } else {
            console.error('⚠️ DIAGNOSIS: Other error (Database might be out of sync or connection issue).');
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
