import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { VectorStoreService } from './vector-store.service';
import { CreateKBDto } from './dto/create-kb.dto';
import { CreateUrlKBDto } from './dto/create-url-kb.dto';
import { KBType, KBStatus } from '@prisma/client';

@Injectable()
export class KnowledgeService {
    constructor(
        @Inject(PrismaService) private prisma: PrismaService,
        @Inject(IngestionService) private ingestionService: IngestionService,
        @Inject(VectorStoreService) private vectorStore: VectorStoreService,
    ) { }

    async createFromFile(orgId: string, dto: CreateKBDto, file: Express.Multer.File) {
        const kb = await this.prisma.knowledgeBase.create({
            data: {
                name: dto.name,
                type: KBType.FILE,
                status: KBStatus.PENDING,
                organizationId: orgId,
            },
        });

        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(process.cwd(), 'uploads');
        const tempPath = path.join(uploadDir, `${kb.id}-${file.originalname}`);

        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            fs.writeFileSync(tempPath, file.buffer);
            this.ingestionService.processFile(kb.id, tempPath, file.mimetype, orgId);
        } catch (error) {
            console.error('Error saving file for processing:', error);
            await this.prisma.knowledgeBase.update({
                where: { id: kb.id },
                data: { status: KBStatus.ERROR, errorMessage: 'Failed to save uploaded file' }
            });
            throw new Error('Failed to process file upload');
        }

        return kb;
    }

    async createFromUrl(orgId: string, dto: CreateUrlKBDto) {
        const kb = await this.prisma.knowledgeBase.create({
            data: {
                name: dto.name,
                type: KBType.URL,
                sourceUrl: dto.url,
                status: KBStatus.PENDING,
                organizationId: orgId,
            },
        });

        this.ingestionService.processUrl(kb.id, dto.url, orgId);

        return kb;
    }

    async findAll(orgId: string) {
        return this.prisma.knowledgeBase.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { vectors: true },
                },
            },
        });
    }

    async remove(id: string, orgId: string) {
        console.log(`[KnowledgeService] Request to remove KB: ${id} for Org: ${orgId}`);

        const kb = await this.prisma.knowledgeBase.findUnique({
            where: { id },
        });

        if (!kb || kb.organizationId !== orgId) {
            console.warn(`[KnowledgeService] KB not found or access denied: ${id}`);
            throw new NotFoundException('Knowledge Base not found');
        }

        try {
            console.log(`[KnowledgeService] Deleting vectors from Weaviate for KB: ${id}`);
            const result = await this.vectorStore.deleteByKbId(id);
            console.log(`[KnowledgeService] Weaviate deletion result:`, JSON.stringify(result));
        } catch (error) {
            console.error('Error deleting from Weaviate (continuing anyway):', error);
        }

        console.log(`[KnowledgeService] Deleting KB from database: ${id}`);
        const deleted = await this.prisma.knowledgeBase.delete({
            where: { id },
        });
        console.log(`[KnowledgeService] KB deleted from database successfully`);

        return deleted;
    }

    async search(query: string, orgId: string, limit = 5) {
        // 1. Generate embedding for query
        const embedding = await this.ingestionService.embedQuery(query);

        // 2. Search in Weaviate (EXCLUDE PRODUCTS!)
        const results = await this.vectorStore.searchKnowledgeOnly(embedding, orgId, limit);

        // 3. Format results
        return results.data.Get.KnowledgeChunk.map((item: any) => ({
            content: item.content,
            source: item.source,
            score: item._additional.distance,
        }));
    }
}
