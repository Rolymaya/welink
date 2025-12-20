import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLastMessages() {
    console.log('=== ÚLTIMAS 5 MENSAGENS ===');
    const messages = await prisma.message.findMany({
        where: {
            direction: 'OUTGOING'
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 5,
        select: {
            id: true,
            content: true,
            createdAt: true,
            direction: true
        }
    });

    messages.forEach(msg => {
        console.log(`\n[${msg.createdAt.toISOString()}] ${msg.direction}`);
        console.log(`Content: ${msg.content}`);
        console.log('---');
    });
}

checkLastMessages()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
