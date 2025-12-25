import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMModule } from './llm/llm.module';
import { PrismaModule } from './prisma/prisma.module';
import { OpenAIIntegrationService } from './llm/openai-integration.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, LLMModule]
})
class TestModule { }

async function testRag() {
    const app = await NestFactory.createApplicationContext(TestModule);
    const openaiIntegration = app.get(OpenAIIntegrationService);
    const prisma = app.get(PrismaService);

    // Agent: Roly Ngalula
    const agentId = '5c732036-e4af-4b73-8e40-94fcc753fd57';

    try {
        console.log('--- TESTING RAG DIRECTLY ---');

        // Garantir contato
        let contact = await prisma.contact.findFirst({
            where: { organizationId: 'edc248f5-309c-466a-ad45-1d0e114250af' }
        });

        if (!contact) {
            console.log('Creating test contact...');
            contact = await prisma.contact.create({
                data: {
                    phone: 'test-rag-phone',
                    name: 'Test RAG User',
                    organizationId: 'edc248f5-309c-466a-ad45-1d0e114250af'
                }
            });
        }

        const contactId = contact.id;
        console.log('Sending query: "Quais os vossos serviços?"');

        const { run, threadId } = await openaiIntegration.generateResponse(
            contactId,
            agentId,
            'Quais os vossos serviços?'
        );

        console.log(`\nRun Status: ${run.status}`);
        console.log(`Thread ID: ${threadId}`);
        console.log(`Run ID: ${run.id}`);

        // Inspecionar Passos do Run
        const openai = await (openaiIntegration as any).getClient();
        const steps = await openai.beta.threads.runs.steps.list(threadId, run.id);

        console.log('\n--- RUN STEPS ---');
        steps.data.forEach((step: any, i: number) => {
            console.log(`Step ${i + 1}: ${step.type} - Status: ${step.status}`);
            if (step.step_details.tool_calls) {
                console.log('Tool Calls:', JSON.stringify(step.step_details.tool_calls, null, 2));
            }
        });

        const finalMsg = await openaiIntegration.getRunResult(threadId, run.id);
        console.log('\n--- FINAL RESPONSE ---');
        console.log(finalMsg);

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await app.close();
        process.exit(0);
    }
}

testRag();
