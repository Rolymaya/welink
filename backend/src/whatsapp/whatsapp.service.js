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
exports.WhatsAppService = void 0;
var common_1 = require("@nestjs/common");
var baileys_1 = require("@whiskeysockets/baileys");
var fs = require("fs");
var path = require("path");
var qrcode = require("qrcode");
var WhatsAppService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var WhatsAppService = _classThis = /** @class */ (function () {
        function WhatsAppService_1(prisma, agentService, knowledgeService, llmProviderService, llmService) {
            this.prisma = prisma;
            this.agentService = agentService;
            this.knowledgeService = knowledgeService;
            this.llmProviderService = llmProviderService;
            this.llmService = llmService;
            this.sessions = new Map(); // sessionId -> socket
        }
        WhatsAppService_1.prototype.onModuleInit = function () {
            return __awaiter(this, void 0, void 0, function () {
                var connectedSessions, _i, connectedSessions_1, session, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Auto-restore all CONNECTED sessions on startup
                            console.log('[WhatsApp] Auto-restoring connected sessions...');
                            return [4 /*yield*/, this.prisma.session.findMany({
                                    where: { status: 'CONNECTED' },
                                })];
                        case 1:
                            connectedSessions = _a.sent();
                            _i = 0, connectedSessions_1 = connectedSessions;
                            _a.label = 2;
                        case 2:
                            if (!(_i < connectedSessions_1.length)) return [3 /*break*/, 7];
                            session = connectedSessions_1[_i];
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            console.log("[WhatsApp] Restoring session: ".concat(session.id));
                            return [4 /*yield*/, this.createSession(session.id)];
                        case 4:
                            _a.sent();
                            return [3 /*break*/, 6];
                        case 5:
                            error_1 = _a.sent();
                            console.error("[WhatsApp] Failed to restore session ".concat(session.id, ":"), error_1);
                            return [3 /*break*/, 6];
                        case 6:
                            _i++;
                            return [3 /*break*/, 2];
                        case 7:
                            console.log("[WhatsApp] Restored ".concat(connectedSessions.length, " session(s)"));
                            return [2 /*return*/];
                    }
                });
            });
        };
        WhatsAppService_1.prototype.createSession = function (sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                var sessionDir, _a, state, saveCreds, version, sock;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            sessionDir = path.join(__dirname, '../../sessions', sessionId);
                            if (!fs.existsSync(sessionDir)) {
                                fs.mkdirSync(sessionDir, { recursive: true });
                            }
                            return [4 /*yield*/, (0, baileys_1.useMultiFileAuthState)(sessionDir)];
                        case 1:
                            _a = _b.sent(), state = _a.state, saveCreds = _a.saveCreds;
                            return [4 /*yield*/, (0, baileys_1.fetchLatestBaileysVersion)()];
                        case 2:
                            version = (_b.sent()).version;
                            sock = (0, baileys_1.default)({
                                version: version,
                                auth: state,
                                printQRInTerminal: false,
                                browser: ['SaaS AI Agent', 'Chrome', '1.0.0'],
                            });
                            this.sessions.set(sessionId, sock);
                            sock.ev.on('creds.update', saveCreds);
                            sock.ev.on('connection.update', function (update) { return __awaiter(_this, void 0, void 0, function () {
                                var connection, lastDisconnect, qr, qrCodeData, shouldReconnect;
                                var _a, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            connection = update.connection, lastDisconnect = update.lastDisconnect, qr = update.qr;
                                            if (!qr) return [3 /*break*/, 3];
                                            return [4 /*yield*/, qrcode.toDataURL(qr)];
                                        case 1:
                                            qrCodeData = _c.sent();
                                            return [4 /*yield*/, this.prisma.session.update({
                                                    where: { id: sessionId },
                                                    data: { qrCode: qrCodeData, status: 'QR_READY' },
                                                })];
                                        case 2:
                                            _c.sent();
                                            _c.label = 3;
                                        case 3:
                                            if (!(connection === 'close')) return [3 /*break*/, 7];
                                            shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
                                            console.log('connection closed due to ', lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error, ', reconnecting ', shouldReconnect);
                                            if (!shouldReconnect) return [3 /*break*/, 4];
                                            this.createSession(sessionId);
                                            return [3 /*break*/, 6];
                                        case 4: return [4 /*yield*/, this.prisma.session.update({
                                                where: { id: sessionId },
                                                data: { status: 'DISCONNECTED' },
                                            })];
                                        case 5:
                                            _c.sent();
                                            this.sessions.delete(sessionId);
                                            _c.label = 6;
                                        case 6: return [3 /*break*/, 9];
                                        case 7:
                                            if (!(connection === 'open')) return [3 /*break*/, 9];
                                            console.log('opened connection');
                                            return [4 /*yield*/, this.prisma.session.update({
                                                    where: { id: sessionId },
                                                    data: { status: 'CONNECTED', qrCode: null },
                                                })];
                                        case 8:
                                            _c.sent();
                                            _c.label = 9;
                                        case 9: return [2 /*return*/];
                                    }
                                });
                            }); });
                            sock.ev.on('messages.upsert', function (m) { return __awaiter(_this, void 0, void 0, function () {
                                var _i, _a, msg;
                                return __generator(this, function (_b) {
                                    if (m.type === 'notify') {
                                        for (_i = 0, _a = m.messages; _i < _a.length; _i++) {
                                            msg = _a[_i];
                                            if (!msg.key.fromMe) {
                                                console.log('replying to', msg.key.remoteJid);
                                                this.handleIncomingMessage(sessionId, msg);
                                            }
                                        }
                                    }
                                    return [2 /*return*/];
                                });
                            }); });
                            return [2 /*return*/];
                    }
                });
            });
        };
        WhatsAppService_1.prototype.handleIncomingMessage = function (sessionId, msg) {
            return __awaiter(this, void 0, void 0, function () {
                var remoteJid, text, session, whatsappNumber, organizationId, contact, provider, aiResponse, sock, error_2, sock;
                var _a, _b, _c, _d, _e, _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            console.log('[WhatsApp] ========== INCOMING MESSAGE ==========');
                            console.log('[WhatsApp] SessionId:', sessionId);
                            console.log('[WhatsApp] Message key:', msg.key);
                            console.log('[WhatsApp] Full message object:', JSON.stringify(msg.message, null, 2));
                            remoteJid = msg.key.remoteJid;
                            text = ((_a = msg.message) === null || _a === void 0 ? void 0 : _a.conversation) ||
                                ((_c = (_b = msg.message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.text) ||
                                ((_e = (_d = msg.message) === null || _d === void 0 ? void 0 : _d.imageMessage) === null || _e === void 0 ? void 0 : _e.caption) ||
                                ((_g = (_f = msg.message) === null || _f === void 0 ? void 0 : _f.videoMessage) === null || _g === void 0 ? void 0 : _g.caption);
                            console.log('[WhatsApp] RemoteJid:', remoteJid);
                            console.log('[WhatsApp] Extracted text:', text);
                            if (!text) {
                                console.log('[WhatsApp] No text content, skipping');
                                console.log('[WhatsApp] Available message types:', Object.keys(msg.message || {}));
                                return [2 /*return*/];
                            }
                            console.log("[WhatsApp] Received message from ".concat(remoteJid, ": ").concat(text));
                            // 1. Find Agent associated with this session
                            console.log('[WhatsApp] Step 1: Finding session and agent...');
                            return [4 /*yield*/, this.prisma.session.findUnique({
                                    where: { id: sessionId },
                                    include: { agent: { include: { organization: true } } },
                                })];
                        case 1:
                            session = _h.sent();
                            if (!session || !session.agent) {
                                console.error("[WhatsApp] Session or Agent not found for sessionId: ".concat(sessionId));
                                return [2 /*return*/];
                            }
                            console.log('[WhatsApp] Found session and agent:', {
                                sessionId: session.id,
                                agentId: session.agent.id,
                                agentName: session.agent.name,
                                orgId: session.agent.organizationId,
                            });
                            whatsappNumber = remoteJid.split('@')[0];
                            organizationId = session.agent.organizationId;
                            // 2. Find or create Contact
                            console.log('[WhatsApp] Step 2: Finding or creating contact...');
                            return [4 /*yield*/, this.prisma.contact.findFirst({
                                    where: {
                                        phone: whatsappNumber,
                                        organizationId: organizationId,
                                    },
                                })];
                        case 2:
                            contact = _h.sent();
                            if (!!contact) return [3 /*break*/, 4];
                            console.log("[WhatsApp] Creating new contact: ".concat(whatsappNumber));
                            return [4 /*yield*/, this.prisma.contact.create({
                                    data: {
                                        phone: whatsappNumber,
                                        name: msg.pushName || 'Unknown',
                                        organizationId: organizationId,
                                        tags: '',
                                    },
                                })];
                        case 3:
                            contact = _h.sent();
                            _h.label = 4;
                        case 4:
                            console.log('[WhatsApp] Contact found/created:', contact.id);
                            // 3. Save incoming message
                            console.log('[WhatsApp] Step 3: Saving incoming message...');
                            return [4 /*yield*/, this.prisma.message.create({
                                    data: {
                                        content: text,
                                        role: 'USER',
                                        sessionId: sessionId,
                                        contactId: contact.id,
                                    },
                                })];
                        case 5:
                            _h.sent();
                            console.log('[WhatsApp] Incoming message saved');
                            // 4. Get active LLM Provider
                            console.log('[WhatsApp] Step 4: Getting active LLM provider...');
                            return [4 /*yield*/, this.llmProviderService.getActiveProvider()];
                        case 6:
                            provider = _h.sent();
                            if (!provider) {
                                console.error('[WhatsApp] No active LLM provider found');
                                return [2 /*return*/];
                            }
                            console.log('[WhatsApp] Active LLM provider:', {
                                provider: provider.provider,
                                model: provider.model,
                            });
                            // 5. Generate AI response
                            console.log('[WhatsApp] Step 5: Generating AI response...');
                            _h.label = 7;
                        case 7:
                            _h.trys.push([7, 13, , 16]);
                            return [4 /*yield*/, this.llmService.generateResponse(provider, session.agent.prompt, text)];
                        case 8:
                            aiResponse = _h.sent();
                            console.log('[WhatsApp] AI response generated:', aiResponse.substring(0, 100) + '...');
                            // 6. Send response via WhatsApp
                            console.log('[WhatsApp] Step 6: Sending response via WhatsApp...');
                            sock = this.sessions.get(sessionId);
                            if (!sock) return [3 /*break*/, 11];
                            return [4 /*yield*/, sock.sendMessage(remoteJid, { text: aiResponse })];
                        case 9:
                            _h.sent();
                            console.log("[WhatsApp] Sent AI response to ".concat(remoteJid));
                            // 7. Save outgoing message
                            console.log('[WhatsApp] Step 7: Saving outgoing message...');
                            return [4 /*yield*/, this.prisma.message.create({
                                    data: {
                                        content: aiResponse,
                                        role: 'ASSISTANT',
                                        sessionId: sessionId,
                                        contactId: contact.id,
                                    },
                                })];
                        case 10:
                            _h.sent();
                            console.log('[WhatsApp] Outgoing message saved');
                            return [3 /*break*/, 12];
                        case 11:
                            console.error('[WhatsApp] Socket not found for sessionId:', sessionId);
                            _h.label = 12;
                        case 12: return [3 /*break*/, 16];
                        case 13:
                            error_2 = _h.sent();
                            console.error('[WhatsApp] Error generating AI response:', error_2);
                            console.error('[WhatsApp] Error stack:', error_2.stack);
                            sock = this.sessions.get(sessionId);
                            if (!sock) return [3 /*break*/, 15];
                            return [4 /*yield*/, sock.sendMessage(remoteJid, {
                                    text: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em breve.',
                                })];
                        case 14:
                            _h.sent();
                            _h.label = 15;
                        case 15: return [3 /*break*/, 16];
                        case 16:
                            console.log('[WhatsApp] ========== FINISHED PROCESSING ==========');
                            return [2 /*return*/];
                    }
                });
            });
        };
        WhatsAppService_1.prototype.getSessionStatus = function (sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.session.findUnique({ where: { id: sessionId } })];
                        case 1:
                            session = _a.sent();
                            return [2 /*return*/, session];
                    }
                });
            });
        };
        return WhatsAppService_1;
    }());
    __setFunctionName(_classThis, "WhatsAppService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WhatsAppService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WhatsAppService = _classThis;
}();
exports.WhatsAppService = WhatsAppService;
