import { ConfigService } from '@nestjs/config';
import { VectorStoreService } from './vector-store.service';
import { PrismaService } from '../prisma/prisma.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';
export declare class IngestionService {
    private configService;
    private vectorStore;
    private prisma;
    private llmProviderService;
    private readonly logger;
    constructor(configService: ConfigService, vectorStore: VectorStoreService, prisma: PrismaService, llmProviderService: LLMProviderService);
    private getEmbeddings;
    embedQuery(text: string): Promise<number[]>;
    processFile(kbId: string, filePath: string, mimeType: string, orgId: string): Promise<void>;
    processUrl(kbId: string, url: string, orgId: string): Promise<void>;
    private updateStatus;
}
