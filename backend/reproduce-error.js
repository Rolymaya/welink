const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fetching user...');
        const user = await prisma.user.findUnique({
            where: { email: 'admin@empresa.com' },
        });

        if (!user) {
            console.error('❌ User not found');
            return;
        }
        console.log('User found:', user.id);

        console.log('Fetching agent...');
        const agent = await prisma.playgroundAgent.findFirst({
            where: { organizationId: user.organizationId },
        });

        if (!agent) {
            console.error('❌ Agent not found. Please create an agent first.');
            return;
        }
        console.log('Agent found:', agent.id);

        console.log('Creating session...');
        const fakeQR = `playground-test-${Date.now()}`;

        const session = await prisma.playgroundSession.create({
            data: {
                userId: user.id,
                agentId: agent.id,
                organizationId: user.organizationId,
                status: 'QR_READY',
                qrCode: fakeQR,
            },
        });

        console.log('✅ Session created successfully:', session.id);

    } catch (error) {
        console.error('❌ Error creating session:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
