
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Deep Chat History Analysis ---');

    // 1. Find Org Roly Ngalula
    const org = await prisma.organization.findFirst({
        where: { name: { contains: 'Roly' } }
    });

    if (!org) {
        console.error('Org Roly not found');
        return;
    }
    console.log(`Org: ${org.name} (${org.id})`);

    // 2. Get recent messages across ALL contacts for this org to find the relevant conversation
    const messages = await prisma.message.findMany({
        where: {
            contact: {
                organizationId: org.id
            }
        },
        include: {
            contact: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 50
    });

    const chronologicalMessages = messages.reverse();

    if (chronologicalMessages.length === 0) {
        console.log('No messages found.');
        return;
    }

    console.log('\n--- Full Conversation Log (Last 50) ---');

    // Group by contact to make it easier to read if there are multiple concurrent chats
    const messagesByContact = {};

    // Just print chronologically first
    chronologicalMessages.forEach(msg => {
        const date = msg.createdAt.toLocaleString('pt-PT');
        const role = msg.role;
        const contactName = msg.contact?.name || 'Unknown';
        const contactPhone = msg.contact?.phone || 'No Phone';
        const sender = role === 'USER' ? `${contactName} (${contactPhone})` : 'AI Agent';

        console.log(`[${date}] [${sender}]: ${msg.content}`);
        if (role === 'ASSISTANT' && msg.content.includes("pedido")) {
            console.log('   >>> MENTIONED ORDER <<<');
        }
    });
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
