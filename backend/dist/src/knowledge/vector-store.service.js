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
var VectorStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreService = void 0;
const common_1 = require("@nestjs/common");
const weaviate_ts_client_1 = require("weaviate-ts-client");
const config_1 = require("@nestjs/config");
let VectorStoreService = VectorStoreService_1 = class VectorStoreService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(VectorStoreService_1.name);
        this.CLASS_NAME = 'KnowledgeChunk';
        this.MESSAGE_CLASS_NAME = 'MessageHistory';
    }
    async onModuleInit() {
        this.client = weaviate_ts_client_1.default.client({
            scheme: 'http',
            host: this.configService.get('WEAVIATE_HOST') || 'localhost:8080',
        });
        await this.ensureSchema();
    }
    async ensureSchema() {
        var _a;
        try {
            const schema = await this.client.schema.getter().do();
            const classExists = (_a = schema.classes) === null || _a === void 0 ? void 0 : _a.some(c => c.class === this.CLASS_NAME);
            if (!classExists) {
                this.logger.log(`Creating Weaviate class: ${this.CLASS_NAME}`);
                await this.client.schema
                    .classCreator()
                    .withClass({
                    class: this.CLASS_NAME,
                    vectorizer: 'none',
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
        }
        catch (error) {
            this.logger.error('Error ensuring Weaviate schema:', error);
        }
    }
    async addVectors(vectors) {
        const batcher = this.client.batch.objectsBatcher();
        for (const vec of vectors) {
            batcher.withObject({
                class: this.CLASS_NAME,
                id: vec.id,
                vector: vec.vector,
                properties: vec.properties,
            });
        }
        const result = await batcher.do();
        const errors = result.filter(r => { var _a; return (_a = r.result) === null || _a === void 0 ? void 0 : _a.errors; });
        if (errors.length > 0) {
            this.logger.error('Errors inserting vectors:', JSON.stringify(errors, null, 2));
            throw new Error('Failed to insert some vectors');
        }
        return result;
    }
    async search(queryVector, orgId, limit = 5) {
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
    async deleteByKbId(kbId) {
        this.logger.log(`[VectorStore] Deleting objects for kbId: ${kbId}`);
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
    async ensureMessageSchema() {
        var _a;
        try {
            const schema = await this.client.schema.getter().do();
            const classExists = (_a = schema.classes) === null || _a === void 0 ? void 0 : _a.some(c => c.class === this.MESSAGE_CLASS_NAME);
            if (!classExists) {
                this.logger.log(`Creating Weaviate class: ${this.MESSAGE_CLASS_NAME}`);
                await this.client.schema
                    .classCreator()
                    .withClass({
                    class: this.MESSAGE_CLASS_NAME,
                    vectorizer: 'none',
                    properties: [
                        { name: 'content', dataType: ['text'] },
                        { name: 'role', dataType: ['string'] },
                        { name: 'sessionId', dataType: ['string'] },
                        { name: 'contactId', dataType: ['string'] },
                        { name: 'timestamp', dataType: ['date'] },
                    ],
                })
                    .do();
            }
        }
        catch (error) {
            this.logger.error('Error ensuring MessageHistory schema:', error);
        }
    }
    async addMessageVector(vector) {
        await this.ensureMessageSchema();
        return this.client.data
            .creator()
            .withClassName(this.MESSAGE_CLASS_NAME)
            .withId(vector.id)
            .withVector(vector.vector)
            .withProperties(vector.properties)
            .do();
    }
    async searchMessages(queryVector, sessionId, limit = 5) {
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
};
exports.VectorStoreService = VectorStoreService;
exports.VectorStoreService = VectorStoreService = VectorStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VectorStoreService);
//# sourceMappingURL=vector-store.service.js.map