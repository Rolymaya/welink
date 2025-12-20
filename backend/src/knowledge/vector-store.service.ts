import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VectorStoreService implements OnModuleInit {
    private client: WeaviateClient;
    private readonly logger = new Logger(VectorStoreService.name);
    private readonly CLASS_NAME = 'KnowledgeChunk';

    constructor(@Inject(ConfigService) private readonly configService: ConfigService) { }

    async onModuleInit() {
        const weaviateUrl = this.configService.get('WEAVIATE_URL');
        const weaviateApiKey = this.configService.get('WEAVIATE_API_KEY');
        const weaviateHost = this.configService.get('WEAVIATE_HOST') || 'localhost:8080';
        const weaviateScheme = this.configService.get('WEAVIATE_SCHEME') || 'http';

        // Prefer WEAVIATE_URL if set, otherwise construct from HOST/SCHEME
        let host = weaviateHost;
        let scheme = weaviateScheme;

        if (weaviateUrl) {
            try {
                const parsed = new URL(weaviateUrl);
                host = parsed.host;
                scheme = parsed.protocol.replace(':', '');
            } catch (e) {
                this.logger.warn(`Invalid WEAVIATE_URL: ${weaviateUrl}, falling back to HOST/SCHEME`);
            }
        }

        this.logger.log(`Connecting to Weaviate at ${scheme}://${host}`);

        this.client = weaviate.client({
            scheme: scheme,
            host: host,
            apiKey: weaviateApiKey ? { apiKey: weaviateApiKey } : undefined,
            // Add custom headers if needed for some providers
        });

        await this.ensureSchema();
    }

    private async ensureSchema() {
        try {
            const schema = await this.client.schema.getter().do();
            const classExists = schema.classes?.some(c => c.class === this.CLASS_NAME);

            if (!classExists) {
                this.logger.log(`Creating Weaviate class: ${this.CLASS_NAME}`);
                await this.client.schema
                    .classCreator()
                    .withClass({
                        class: this.CLASS_NAME,
                        vectorizer: 'none', // We provide vectors manually
                        properties: [
                            { name: 'content', dataType: ['text'] },
                            { name: 'kbId', dataType: ['string'] },
                            { name: 'orgId', dataType: ['string'] },
                            { name: 'source', dataType: ['string'] },
                            { name: 'chunkIndex', dataType: ['int'] },
                        ],
                    })
                    .do();
            }
        } catch (error) {
            this.logger.error('Error ensuring Weaviate schema:', error);
        }
    }

    async addVectors(vectors: { id: string; vector: number[]; properties: any }[]) {
        const batcher = this.client.batch.objectsBatcher();

        for (const vec of vectors) {
            batcher.withObject({
                class: this.CLASS_NAME,
                id: vec.id, // Use UUID from our DB
                vector: vec.vector,
                properties: vec.properties,
            });
        }

        const result = await batcher.do();

        // Check for errors
        const errors = result.filter(r => r.result?.errors);
        if (errors.length > 0) {
            this.logger.error('Errors inserting vectors:', JSON.stringify(errors, null, 2));
            throw new Error('Failed to insert some vectors');
        }

        return result;
    }

    async search(queryVector: number[], orgId: string, limit = 5) {
        return this.client.graphql
            .get()
            .withClassName(this.CLASS_NAME)
            .withFields('content kbId source _additional { distance }')
            .withNearVector({ vector: queryVector })
            .withWhere({
                path: ['orgId'],
                operator: 'Equal',
                valueString: orgId,
            })
            .withLimit(limit)
            .do();
    }

    async searchKnowledgeOnly(queryVector: number[], orgId: string, limit = 5) {
        // Search but exclude products (kbId != 'system-products')
        return this.client.graphql
            .get()
            .withClassName(this.CLASS_NAME)
            .withFields('content kbId source _additional { distance }')
            .withNearVector({ vector: queryVector })
            .withWhere({
                operator: 'And',
                operands: [
                    {
                        path: ['orgId'],
                        operator: 'Equal',
                        valueString: orgId,
                    },
                    {
                        path: ['kbId'],
                        operator: 'NotEqual',
                        valueString: 'system-products', // Exclude products
                    },
                ],
            })
            .withLimit(limit)
            .do();
    }

    async deleteByKbId(kbId: string) {
        this.logger.log(`[VectorStore] Deleting objects for kbId: ${kbId}`);
        // Weaviate batch delete
        const result = await this.client.batch
            .objectsBatchDeleter()
            .withClassName(this.CLASS_NAME)
            .withWhere({
                path: ['kbId'],
                operator: 'Equal',
                valueString: kbId,
            })
            .do();

        this.logger.log(`[VectorStore] Deletion result: ${JSON.stringify(result)}`);
        return result;
    }

    async deleteObjectById(id: string) {
        this.logger.log(`[VectorStore] Deleting object by ID: ${id}`);
        const result = await this.client.data
            .deleter()
            .withClassName(this.CLASS_NAME)
            .withId(id)
            .do();

        this.logger.log(`[VectorStore] Single object deletion result: ${JSON.stringify(result)}`);
        return result;
    }

    // --- Message History Methods ---

    private readonly MESSAGE_CLASS_NAME = 'MessageHistory';

    async ensureMessageSchema() {
        try {
            const schema = await this.client.schema.getter().do();
            const classExists = schema.classes?.some(c => c.class === this.MESSAGE_CLASS_NAME);

            if (!classExists) {
                this.logger.log(`Creating Weaviate class: ${this.MESSAGE_CLASS_NAME}`);
                await this.client.schema
                    .classCreator()
                    .withClass({
                        class: this.MESSAGE_CLASS_NAME,
                        vectorizer: 'none',
                        properties: [
                            { name: 'content', dataType: ['text'] },
                            { name: 'role', dataType: ['string'] }, // 'USER' | 'ASSISTANT'
                            { name: 'sessionId', dataType: ['string'] },
                            { name: 'contactId', dataType: ['string'] },
                            { name: 'timestamp', dataType: ['date'] },
                        ],
                    })
                    .do();
            }
        } catch (error) {
            this.logger.error('Error ensuring MessageHistory schema:', error);
        }
    }

    async addMessageVector(vector: { id: string; vector: number[]; properties: any }) {
        await this.ensureMessageSchema(); // Ensure schema exists before adding

        return this.client.data
            .creator()
            .withClassName(this.MESSAGE_CLASS_NAME)
            .withId(vector.id)
            .withVector(vector.vector)
            .withProperties(vector.properties)
            .do();
    }

    async searchMessages(queryVector: number[], sessionId: string, limit = 5) {
        await this.ensureMessageSchema();

        return this.client.graphql
            .get()
            .withClassName(this.MESSAGE_CLASS_NAME)
            .withFields('content role timestamp _additional { distance }')
            .withNearVector({ vector: queryVector })
            .withWhere({
                path: ['sessionId'],
                operator: 'Equal',
                valueString: sessionId,
            })
            .withLimit(limit)
            .do();
    }

    // --- Text-based Search (for hybrid agent) ---

    async searchByText(query: string, filter: any): Promise<any[]> {
        // For now, return empty array - will implement with embeddings later
        // This is a placeholder to prevent errors
        return [];
    }

    async addDocument(doc: { content: string; metadata: any }): Promise<void> {
        // Placeholder - will implement with embeddings later
        // Silently skip for now
    }
}
