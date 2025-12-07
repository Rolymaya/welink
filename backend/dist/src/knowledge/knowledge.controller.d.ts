import { KnowledgeService } from './knowledge.service';
import { CreateKBDto } from './dto/create-kb.dto';
import { CreateUrlKBDto } from './dto/create-url-kb.dto';
export declare class KnowledgeController {
    private readonly knowledgeService;
    constructor(knowledgeService: KnowledgeService);
    uploadFile(req: any, file: Express.Multer.File, dto: CreateKBDto): Promise<{
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
    addUrl(req: any, dto: CreateUrlKBDto): Promise<{
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
    findAll(req: any): Promise<({
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
    remove(req: any, id: string): Promise<{
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
}
