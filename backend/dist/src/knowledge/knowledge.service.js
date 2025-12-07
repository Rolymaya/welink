"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ingestion_service_1 = require("./ingestion.service");
const vector_store_service_1 = require("./vector-store.service");
const client_1 = require("@prisma/client");
let KnowledgeService = class KnowledgeService {
    constructor(prisma, ingestionService, vectorStore) {
        this.prisma = prisma;
        this.ingestionService = ingestionService;
        this.vectorStore = vectorStore;
    }
    async createFromFile(orgId, dto, file) {
        const kb = await this.prisma.knowledgeBase.create({
            data: {
                name: dto.name,
                type: client_1.KBType.FILE,
                status: client_1.KBStatus.PENDING,
                organizationId: orgId,
            },
        });
        const fs = require('fs');
        const path = require('path');
        const tempPath = path.join(__dirname, '../../uploads', `${kb.id}-${file.originalname}`);
        if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
            fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
        }
        fs.writeFileSync(tempPath, file.buffer);
        this.ingestionService.processFile(kb.id, tempPath, file.mimetype, orgId);
        return kb;
    }
    async createFromUrl(orgId, dto) {
        const kb = await this.prisma.knowledgeBase.create({
            data: {
                name: dto.name,
                type: client_1.KBType.URL,
                sourceUrl: dto.url,
                status: client_1.KBStatus.PENDING,
                organizationId: orgId,
            },
        });
        this.ingestionService.processUrl(kb.id, dto.url, orgId);
        return kb;
    }
    async findAll(orgId) {
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
    async remove(id, orgId) {
        console.log(`[KnowledgeService] Request to remove KB: ${id} for Org: ${orgId}`);
        const kb = await this.prisma.knowledgeBase.findUnique({
            where: { id },
        });
        if (!kb || kb.organizationId !== orgId) {
            console.warn(`[KnowledgeService] KB not found or access denied: ${id}`);
            throw new common_1.NotFoundException('Knowledge Base not found');
        }
        try {
            console.log(`[KnowledgeService] Deleting vectors from Weaviate for KB: ${id}`);
            const result = await this.vectorStore.deleteByKbId(id);
            console.log(`[KnowledgeService] Weaviate deletion result:`, JSON.stringify(result));
        }
        catch (error) {
            console.error('Error deleting from Weaviate (continuing anyway):', error);
        }
        console.log(`[KnowledgeService] Deleting KB from database: ${id}`);
        const deleted = await this.prisma.knowledgeBase.delete({
            where: { id },
        });
        console.log(`[KnowledgeService] KB deleted from database successfully`);
        return deleted;
    }
    async search(query, orgId, limit = 5) {
        const embedding = await this.ingestionService.embedQuery(query);
        const results = await this.vectorStore.search(embedding, orgId, limit);
        return results.data.Get.KnowledgeChunk.map((item) => ({
            content: item.content,
            source: item.source,
            score: item._additional.distance,
        }));
    }
};
exports.KnowledgeService = KnowledgeService;
exports.KnowledgeService = KnowledgeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ingestion_service_1.IngestionService,
        vector_store_service_1.VectorStoreService])
], KnowledgeService);
//# sourceMappingURL=knowledge.service.js.map