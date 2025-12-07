import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestionService } from './ingestion.service';
import { VectorStoreService } from './vector-store.service';
import { CreateKBDto } from './dto/create-kb.dto';
import { CreateUrlKBDto } from './dto/create-url-kb.dto';
import { KBType, KBStatus } from '@prisma/client';

@Injectable()
export class KnowledgeService {
    constructor(
        private prisma: PrismaService,
        private ingestionService: IngestionService,
        private vectorStore: VectorStoreService,
    ) { }

    async createFromFile(orgId: string, dto: CreateKBDto, file: Express.Multer.File) {
        // 1. Create KB record
        const kb = await this.prisma.knowledgeBase.create({
            data: {
                name: dto.name,
                type: KBType.FILE,
                status: KBStatus.PENDING,
                organizationId: orgId,
            },
        });

        // 2. Trigger async processing
        const fs = require('fs');
        const path = require('path');
        const tempPath = path.join(__dirname, '../../uploads', `${kb.id}-${file.originalname}`);

        // Ensure uploads dir exists
        if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
            fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
        }

        fs.writeFileSync(tempPath, file.buffer);

        // Don't await this, let it run in background
        this.ingestionService.processFile(kb.id, tempPath, file.mimetype, orgId);

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

        // 1. Try to delete vectors from Weaviate (but don't fail if it errors)
        try {
            console.log(`[KnowledgeService] Deleting vectors from Weaviate for KB: ${id}`);
            const result = await this.vectorStore.deleteByKbId(id);
            console.log(`[KnowledgeService] Weaviate deletion result:`, JSON.stringify(result));
        } catch (error) {
            console.error('Error deleting from Weaviate (continuing anyway):', error);
        }

        // 2. Delete from DB (Cascade will handle vectors table)
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

        // 2. Search in Weaviate
        const results = await this.vectorStore.search(embedding, orgId, limit);

        // 3. Format results
        return results.data.Get.KnowledgeChunk.map((item: any) => ({
            content: item.content,
            source: item.source,
            score: item._additional.distance,
        }));
    }
}
