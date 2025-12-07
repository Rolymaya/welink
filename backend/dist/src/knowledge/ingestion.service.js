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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs/promises");
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const docx_1 = require("@langchain/community/document_loaders/fs/docx");
const cheerio_1 = require("@langchain/community/document_loaders/web/cheerio");
const textsplitters_1 = require("@langchain/textsplitters");
const openai_1 = require("@langchain/openai");
const vector_store_service_1 = require("./vector-store.service");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const llm_provider_service_1 = require("../super-admin/llm-provider.service");
let IngestionService = IngestionService_1 = class IngestionService {
    constructor(configService, vectorStore, prisma, llmProviderService) {
        this.configService = configService;
        this.vectorStore = vectorStore;
        this.prisma = prisma;
        this.llmProviderService = llmProviderService;
        this.logger = new common_1.Logger(IngestionService_1.name);
    }
    async getEmbeddings() {
        const provider = await this.llmProviderService.getActiveProvider();
        if (!provider || !provider.apiKey) {
            throw new Error('No active LLM provider or API key found');
        }
        return new openai_1.OpenAIEmbeddings({
            openAIApiKey: provider.apiKey,
            modelName: 'text-embedding-3-small',
        });
    }
    async embedQuery(text) {
        const embeddings = await this.getEmbeddings();
        return embeddings.embedQuery(text);
    }
    async processFile(kbId, filePath, mimeType, orgId) {
        try {
            await this.updateStatus(kbId, client_1.KBStatus.PROCESSING);
            let docs = [];
            if (mimeType === 'application/pdf') {
                const loader = new pdf_1.PDFLoader(filePath);
                docs = await loader.load();
            }
            else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const loader = new docx_1.DocxLoader(filePath);
                docs = await loader.load();
            }
            else {
                const text = await fs.readFile(filePath, 'utf-8');
                docs = [{ pageContent: text, metadata: { source: filePath } }];
            }
            const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            const chunks = await splitter.splitDocuments(docs);
            this.logger.log(`Generated ${chunks.length} chunks for KB ${kbId}`);
            const vectors = [];
            const embeddings = await this.getEmbeddings();
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const content = chunk.pageContent;
                const embedding = await embeddings.embedQuery(content);
                const vectorId = (0, uuid_1.v4)();
                await this.prisma.knowledgeVector.create({
                    data: {
                        id: vectorId,
                        knowledgeBaseId: kbId,
                        weaviateId: vectorId,
                        content: content,
                        metadata: chunk.metadata || {},
                    },
                });
                vectors.push({
                    id: vectorId,
                    vector: embedding,
                    properties: {
                        content,
                        kbId,
                        orgId,
                        source: filePath,
                        chunkIndex: i,
                    },
                });
            }
            if (vectors.length > 0) {
                await this.vectorStore.addVectors(vectors);
            }
            try {
                await fs.unlink(filePath);
            }
            catch (e) {
                this.logger.warn(`Failed to delete temp file: ${filePath}`);
            }
            await this.updateStatus(kbId, client_1.KBStatus.READY);
            this.logger.log(`KB ${kbId} processing complete`);
        }
        catch (error) {
            this.logger.error(`Error processing KB ${kbId}:`, error);
            await this.updateStatus(kbId, client_1.KBStatus.ERROR, error.message);
        }
    }
    async processUrl(kbId, url, orgId) {
        try {
            await this.updateStatus(kbId, client_1.KBStatus.PROCESSING);
            const loader = new cheerio_1.CheerioWebBaseLoader(url);
            const docs = await loader.load();
            const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            const chunks = await splitter.splitDocuments(docs);
            const vectors = [];
            const embeddings = await this.getEmbeddings();
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const content = chunk.pageContent;
                const embedding = await embeddings.embedQuery(content);
                const vectorId = (0, uuid_1.v4)();
                await this.prisma.knowledgeVector.create({
                    data: {
                        id: vectorId,
                        knowledgeBaseId: kbId,
                        weaviateId: vectorId,
                        content: content,
                        metadata: chunk.metadata || {},
                    },
                });
                vectors.push({
                    id: vectorId,
                    vector: embedding,
                    properties: {
                        content,
                        kbId,
                        orgId,
                        source: url,
                        chunkIndex: i,
                    },
                });
            }
            if (vectors.length > 0) {
                await this.vectorStore.addVectors(vectors);
            }
            await this.updateStatus(kbId, client_1.KBStatus.READY);
        }
        catch (error) {
            this.logger.error(`Error processing URL KB ${kbId}:`, error);
            await this.updateStatus(kbId, client_1.KBStatus.ERROR, error.message);
        }
    }
    async updateStatus(id, status, errorMessage) {
        await this.prisma.knowledgeBase.update({
            where: { id },
            data: { status, errorMessage },
        });
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = IngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => llm_provider_service_1.LLMProviderService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        vector_store_service_1.VectorStoreService,
        prisma_service_1.PrismaService,
        llm_provider_service_1.LLMProviderService])
], IngestionService);
//# sourceMappingURL=ingestion.service.js.map