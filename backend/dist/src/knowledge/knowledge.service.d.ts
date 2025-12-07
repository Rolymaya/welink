import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { VectorStoreService } from './vector-store.service';
import { CreateKBDto } from './dto/create-kb.dto';
import { CreateUrlKBDto } from './dto/create-url-kb.dto';
export declare class KnowledgeService {
    private prisma;
    private ingestionService;
    private vectorStore;
    constructor(prisma: PrismaService, ingestionService: IngestionService, vectorStore: VectorStoreService);
    createFromFile(orgId: string, dto: CreateKBDto, file: Express.Multer.File): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.KBType;
        status: import(".prisma/client").$Enums.KBStatus;
        sourceUrl: string | null;
        errorMessage: string | null;
    }>;
    createFromUrl(orgId: string, dto: CreateUrlKBDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.KBType;
        status: import(".prisma/client").$Enums.KBStatus;
        sourceUrl: string | null;
        errorMessage: string | null;
    }>;
    findAll(orgId: string): Promise<({
        _count: {
            vectors: number;
        };
    } & {
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.KBType;
        status: import(".prisma/client").$Enums.KBStatus;
        sourceUrl: string | null;
        errorMessage: string | null;
    })[]>;
    remove(id: string, orgId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.KBType;
        status: import(".prisma/client").$Enums.KBStatus;
        sourceUrl: string | null;
        errorMessage: string | null;
    }>;
    search(query: string, orgId: string, limit?: number): Promise<any>;
}
