import { PrismaClient } from '@prisma/client';

async function readPrompt() {
    const prisma = new PrismaClient();
    try {
        const agent = await prisma.agent.findUnique({
            where: { id: '5c732036-e4af-4b73-8e40-94fcc753fd57' }
        });
        if (agent) {
            console.log('--- FULL AGENT PROMPT ---');
            console.log(agent.prompt);
            console.log('--- END ---');
        } else {
            console.log('Agent not found');
        }
    } finally {
        await prisma.$disconnect();
    }
}

readPrompt();
