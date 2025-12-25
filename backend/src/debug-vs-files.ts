import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

async function listVsFiles() {
    const prisma = new PrismaClient();
    try {
        const provider = await prisma.lLMProvider.findFirst({
            where: { isActive: true, name: { contains: 'OpenAI' } }
        });

        if (!provider || !provider.apiKey) {
            console.error('OpenAI API Key not found');
            return;
        }

        const openai = new OpenAI({ apiKey: provider.apiKey });
        const vsId = 'vs_6949a2a184788191891934b55eba6ce9';

        console.log(`--- Listing files for Vector Store: ${vsId} ---`);

        // Use the correct path for version 4.104.0
        const files = await (openai as any).vectorStores.files.list(vsId);

        console.log(`Found ${files.data.length} files.`);
        for (const file of files.data) {
            console.log(`File ID: ${file.id} - Status: ${file.status}`);
        }

        const vs = await (openai as any).vectorStores.retrieve(vsId);
        console.log('\nVector Store Details:');
        console.log(JSON.stringify(vs, null, 2));

    } catch (e) {
        console.error('Debug failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

listVsFiles();
