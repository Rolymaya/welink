import { PrismaClient } from '@prisma/client';

async function debugRag() {
    const prisma = new PrismaClient();
    try {
        console.log('--- RAG DATA DEBUG ---');

        const orgs = await prisma.organization.findMany({
            include: { agents: true, knowledgeBases: true }
        });

        console.log(`Found ${orgs.length} organizations.`);

        for (const org of orgs) {
            console.log(`\n========================================`);
            console.log(`Organization: ${org.name} (${org.id})`);
            console.log(`Slug: ${org.slug}`);
            console.log(`OpenAI Vector Store ID: ${org.openaiVectorStoreId}`);

            console.log('\n--- KNOWLEDGE BASES ---');
            org.knowledgeBases.forEach(kb => {
                console.log(`KB: ${kb.name} (${kb.id}) - Status: ${kb.status}`);
            });

            console.log('\n--- AGENTS ---');
            org.agents.forEach(agent => {
                console.log(`Agent: ${agent.name} (${agent.id})`);
                console.log(`OpenAI Assistant ID: ${agent.openaiAssistantId}`);
            });
        }

    } catch (e) {
        console.error('Debug failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debugRag();
