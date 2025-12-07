import { PrismaService } from '../prisma/prisma.service';
export declare class LLMProviderService {
    private prisma;
    constructor(prisma: PrismaService);
    getActiveProvider(preferredProvider?: string): Promise<{
        provider: string;
        apiKey: string;
        baseUrl: string;
        model: string;
        models: string;
        defaultModel: string;
    }>;
}
