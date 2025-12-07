import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
// @ts-ignore
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// @ts-ignore
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
// @ts-ignore
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { VectorStoreService } from './vector-store.service';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { KBStatus } from '@prisma/client';
import { LLMProviderService } from '../super-admin/llm-provider.service';

@Injectable()
export class IngestionService {
    private readonly logger = new Logger(IngestionService.name);

    constructor(
        private configService: ConfigService,
        private vectorStore: VectorStoreService,
        private prisma: PrismaService,
        @Inject(forwardRef(() => LLMProviderService))
        private llmProviderService: LLMProviderService,
    ) { }

    private async getEmbeddings() {
        const provider = await this.llmProviderService.getActiveProvider();
        if (!provider || !provider.apiKey) {
            throw new Error('No active LLM provider or API key found');
        }

        // Currently only supporting OpenAI embeddings
        // In future, we can switch based on provider.provider (e.g. 'openai', 'gemini')
        return new OpenAIEmbeddings({
            openAIApiKey: provider.apiKey,
            modelName: 'text-embedding-3-small',
        });
    }

    async embedQuery(text: string) {
        const embeddings = await this.getEmbeddings();
        return embeddings.embedQuery(text);
    }

    async processFile(kbId: string, filePath: string, mimeType: string, orgId: string) {
        try {
            await this.updateStatus(kbId, KBStatus.PROCESSING);

            // 1. Load Document
            let docs: any[] = [];

            if (mimeType === 'application/pdf') {
                const loader = new PDFLoader(filePath);
                docs = await loader.load();
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const loader = new DocxLoader(filePath);
                docs = await loader.load();
            } else {
                // Manual Text Loading
                const text = await fs.readFile(filePath, 'utf-8');
                docs = [{ pageContent: text, metadata: { source: filePath } }];
            }

            // 2. Split Text
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            const chunks = await splitter.splitDocuments(docs);

            this.logger.log(`Generated ${chunks.length} chunks for KB ${kbId}`);

            // 3. Generate Embeddings & Store
            const vectors = [];
            const embeddings = await this.getEmbeddings();

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const content = chunk.pageContent;

                // Generate embedding
                const embedding = await embeddings.embedQuery(content);

                // Create DB record
                const vectorId = uuidv4(); // Weaviate ID needs to be UUID

                await this.prisma.knowledgeVector.create({
                    data: {
                        id: vectorId, // Use same ID for sync
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

            // Batch insert to Weaviate
            if (vectors.length > 0) {
                await this.vectorStore.addVectors(vectors);
            }

            // Cleanup file
            try {
                await fs.unlink(filePath);
            } catch (e) {
                this.logger.warn(`Failed to delete temp file: ${filePath}`);
            }

            await this.updateStatus(kbId, KBStatus.READY);
            this.logger.log(`KB ${kbId} processing complete`);

        } catch (error) {
            this.logger.error(`Error processing KB ${kbId}:`, error);
            await this.updateStatus(kbId, KBStatus.ERROR, error.message);
        }
    }

    async processUrl(kbId: string, url: string, orgId: string) {
        try {
            await this.updateStatus(kbId, KBStatus.PROCESSING);

            // 1. Load URL
            const loader = new CheerioWebBaseLoader(url);
            const docs = await loader.load();

            // 2. Split Text
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            const chunks = await splitter.splitDocuments(docs);

            // 3. Generate Embeddings & Store
            const vectors = [];
            const embeddings = await this.getEmbeddings();

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const content = chunk.pageContent;

                const embedding = await embeddings.embedQuery(content);
                const vectorId = uuidv4();

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

            await this.updateStatus(kbId, KBStatus.READY);

        } catch (error) {
            this.logger.error(`Error processing URL KB ${kbId}:`, error);
            await this.updateStatus(kbId, KBStatus.ERROR, error.message);
        }
    }

    private async updateStatus(id: string, status: KBStatus, errorMessage?: string) {
        await this.prisma.knowledgeBase.update({
            where: { id },
            data: { status, errorMessage },
        });
    }
}
