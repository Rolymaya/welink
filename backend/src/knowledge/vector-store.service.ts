import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VectorStoreService implements OnModuleInit {
    private client: WeaviateClient;
    private readonly logger = new Logger(VectorStoreService.name);
    private readonly CLASS_NAME = 'KnowledgeChunk';

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        this.client = weaviate.client({
            scheme: 'http',
            host: this.configService.get('WEAVIATE_HOST') || 'localhost:8080',
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
}
