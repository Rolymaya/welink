"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
var common_1 = require("@nestjs/common");
var pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
var docx_1 = require("@langchain/community/document_loaders/fs/docx");
var text_1 = require("langchain/document_loaders/fs/text");
var cheerio_1 = require("@langchain/community/document_loaders/web/cheerio");
var text_splitter_1 = require("langchain/text_splitter");
var openai_1 = require("@langchain/openai");
var uuid_1 = require("uuid");
var fs = require("fs");
var IngestionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var IngestionService = _classThis = /** @class */ (function () {
        function IngestionService_1(configService, vectorStore, prisma) {
            this.configService = configService;
            this.vectorStore = vectorStore;
            this.prisma = prisma;
            this.logger = new common_1.Logger(IngestionService.name);
            this.embeddings = new openai_1.OpenAIEmbeddings({
                openAIApiKey: this.configService.get('OPENAI_API_KEY'),
                modelName: 'text-embedding-3-small',
            });
        }
        IngestionService_1.prototype.processFile = function (kbId, filePath, mimeType, orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var loader, docs, splitter, chunks, vectors, i, chunk, content, embedding, vectorId, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 12, , 14]);
                            return [4 /*yield*/, this.updateStatus(kbId, 'PROCESSING')];
                        case 1:
                            _a.sent();
                            loader = void 0;
                            if (mimeType === 'application/pdf') {
                                loader = new pdf_1.PDFLoader(filePath);
                            }
                            else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                                loader = new docx_1.DocxLoader(filePath);
                            }
                            else {
                                loader = new text_1.TextLoader(filePath);
                            }
                            return [4 /*yield*/, loader.load()];
                        case 2:
                            docs = _a.sent();
                            splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
                                chunkSize: 1000,
                                chunkOverlap: 200,
                            });
                            return [4 /*yield*/, splitter.splitDocuments(docs)];
                        case 3:
                            chunks = _a.sent();
                            this.logger.log("Generated ".concat(chunks.length, " chunks for KB ").concat(kbId));
                            vectors = [];
                            i = 0;
                            _a.label = 4;
                        case 4:
                            if (!(i < chunks.length)) return [3 /*break*/, 8];
                            chunk = chunks[i];
                            content = chunk.pageContent;
                            return [4 /*yield*/, this.embeddings.embedQuery(content)];
                        case 5:
                            embedding = _a.sent();
                            vectorId = (0, uuid_1.v4)();
                            return [4 /*yield*/, this.prisma.knowledgeVector.create({
                                    data: {
                                        id: vectorId, // Use same ID for sync
                                        knowledgeBaseId: kbId,
                                        weaviateId: vectorId,
                                        content: content,
                                        metadata: chunk.metadata,
                                    },
                                })];
                        case 6:
                            _a.sent();
                            vectors.push({
                                id: vectorId,
                                vector: embedding,
                                properties: {
                                    content: content,
                                    kbId: kbId,
                                    orgId: orgId,
                                    source: filePath,
                                    chunkIndex: i,
                                },
                            });
                            _a.label = 7;
                        case 7:
                            i++;
                            return [3 /*break*/, 4];
                        case 8:
                            if (!(vectors.length > 0)) return [3 /*break*/, 10];
                            return [4 /*yield*/, this.vectorStore.addVectors(vectors)];
                        case 9:
                            _a.sent();
                            _a.label = 10;
                        case 10:
                            // Cleanup file
                            try {
                                fs.unlinkSync(filePath);
                            }
                            catch (e) {
                                this.logger.warn("Failed to delete temp file: ".concat(filePath));
                            }
                            return [4 /*yield*/, this.updateStatus(kbId, 'READY')];
                        case 11:
                            _a.sent();
                            this.logger.log("KB ".concat(kbId, " processing complete"));
                            return [3 /*break*/, 14];
                        case 12:
                            error_1 = _a.sent();
                            this.logger.error("Error processing KB ".concat(kbId, ":"), error_1);
                            return [4 /*yield*/, this.updateStatus(kbId, 'ERROR', error_1.message)];
                        case 13:
                            _a.sent();
                            return [3 /*break*/, 14];
                        case 14: return [2 /*return*/];
                    }
                });
            });
        };
        IngestionService_1.prototype.processUrl = function (kbId, url, orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var loader, docs, splitter, chunks, vectors, i, chunk, content, embedding, vectorId, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 12, , 14]);
                            return [4 /*yield*/, this.updateStatus(kbId, 'PROCESSING')];
                        case 1:
                            _a.sent();
                            loader = new cheerio_1.CheerioWebBaseLoader(url);
                            return [4 /*yield*/, loader.load()];
                        case 2:
                            docs = _a.sent();
                            splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
                                chunkSize: 1000,
                                chunkOverlap: 200,
                            });
                            return [4 /*yield*/, splitter.splitDocuments(docs)];
                        case 3:
                            chunks = _a.sent();
                            vectors = [];
                            i = 0;
                            _a.label = 4;
                        case 4:
                            if (!(i < chunks.length)) return [3 /*break*/, 8];
                            chunk = chunks[i];
                            content = chunk.pageContent;
                            return [4 /*yield*/, this.embeddings.embedQuery(content)];
                        case 5:
                            embedding = _a.sent();
                            vectorId = (0, uuid_1.v4)();
                            return [4 /*yield*/, this.prisma.knowledgeVector.create({
                                    data: {
                                        id: vectorId,
                                        knowledgeBaseId: kbId,
                                        weaviateId: vectorId,
                                        content: content,
                                        metadata: chunk.metadata,
                                    },
                                })];
                        case 6:
                            _a.sent();
                            vectors.push({
                                id: vectorId,
                                vector: embedding,
                                properties: {
                                    content: content,
                                    kbId: kbId,
                                    orgId: orgId,
                                    source: url,
                                    chunkIndex: i,
                                },
                            });
                            _a.label = 7;
                        case 7:
                            i++;
                            return [3 /*break*/, 4];
                        case 8:
                            if (!(vectors.length > 0)) return [3 /*break*/, 10];
                            return [4 /*yield*/, this.vectorStore.addVectors(vectors)];
                        case 9:
                            _a.sent();
                            _a.label = 10;
                        case 10: return [4 /*yield*/, this.updateStatus(kbId, 'READY')];
                        case 11:
                            _a.sent();
                            return [3 /*break*/, 14];
                        case 12:
                            error_2 = _a.sent();
                            this.logger.error("Error processing URL KB ".concat(kbId, ":"), error_2);
                            return [4 /*yield*/, this.updateStatus(kbId, 'ERROR', error_2.message)];
                        case 13:
                            _a.sent();
                            return [3 /*break*/, 14];
                        case 14: return [2 /*return*/];
                    }
                });
            });
        };
        IngestionService_1.prototype.updateStatus = function (id, status, errorMessage) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.knowledgeBase.update({
                                where: { id: id },
                                data: { status: status, errorMessage: errorMessage },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return IngestionService_1;
    }());
    __setFunctionName(_classThis, "IngestionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        IngestionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return IngestionService = _classThis;
}();
exports.IngestionService = IngestionService;
