import { PrismaService } from '../prisma/prisma.service';
export declare class LLMService {
    private prisma;
    constructor(prisma: PrismaService);
    generateResponse(provider: any, systemPrompt: string, userMessage: string, context?: string, organizationId?: string, agentId?: string): Promise<string>;
    private logUsage;
    private callGemini;
    private callOpenAI;
}
