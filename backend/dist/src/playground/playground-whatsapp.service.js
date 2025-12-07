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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaygroundWhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const baileys_1 = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const llm_service_1 = require("../llm/llm.service");
let PlaygroundWhatsAppService = class PlaygroundWhatsAppService {
    constructor(prisma, llmService) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.sessions = new Map();
    }
    async createSession(sessionId) {
        const sessionDir = path.join(__dirname, '../../sessions', sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(sessionDir);
        const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const sock = (0, baileys_1.default)({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['SaaS AI Agent', 'Chrome', '1.0.0'],
        });
        this.sessions.set(sessionId, sock);
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', async (update) => {
            var _a, _b;
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                await this.prisma.playgroundSession.update({
                    where: { id: sessionId },
                    data: { qrCode: qr, status: 'QR_READY' },
                });
            }
            if (connection === 'close') {
                const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
                console.log('[Playground] Connection closed:', lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error, 'reconnecting:', shouldReconnect);
                if (shouldReconnect) {
                    this.createSession(sessionId);
                }
                else {
                    try {
                        await this.prisma.playgroundSession.update({
                            where: { id: sessionId },
                            data: { status: 'DISCONNECTED' },
                        });
                    }
                    catch (e) {
                        console.log(`[Playground] Could not update session ${sessionId} (might be deleted)`);
                    }
                    this.sessions.delete(sessionId);
                }
            }
            else if (connection === 'open') {
                console.log('[Playground] Connection opened for session:', sessionId);
                await this.prisma.playgroundSession.update({
                    where: { id: sessionId },
                    data: { status: 'CONNECTED', qrCode: null },
                });
            }
        });
        sock.ev.on('messages.upsert', async (m) => {
            var _a, _b;
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    const isFromMe = msg.key.fromMe;
                    const isGroup = (_a = msg.key.remoteJid) === null || _a === void 0 ? void 0 : _a.endsWith('@g.us');
                    const isBroadcast = (_b = msg.key.remoteJid) === null || _b === void 0 ? void 0 : _b.endsWith('@broadcast');
                    const isStatus = msg.key.remoteJid === 'status@broadcast';
                    if (!isFromMe && !isGroup && !isBroadcast && !isStatus) {
                        console.log('[Playground] Received message from', msg.key.remoteJid);
                        await this.handleIncomingMessage(sessionId, msg, sock);
                    }
                    else {
                        console.log('[Playground] Ignoring message:', {
                            fromMe: isFromMe,
                            isGroup,
                            isBroadcast,
                            isStatus,
                            remoteJid: msg.key.remoteJid
                        });
                    }
                }
            }
        });
    }
    async handleIncomingMessage(sessionId, msg, sock) {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            console.log('[Playground] Processing incoming message for session:', sessionId);
            const remoteJid = msg.key.remoteJid;
            const text = ((_a = msg.message) === null || _a === void 0 ? void 0 : _a.conversation) ||
                ((_c = (_b = msg.message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.text) ||
                ((_e = (_d = msg.message) === null || _d === void 0 ? void 0 : _d.imageMessage) === null || _e === void 0 ? void 0 : _e.caption) ||
                ((_g = (_f = msg.message) === null || _f === void 0 ? void 0 : _f.videoMessage) === null || _g === void 0 ? void 0 : _g.caption);
            if (!text) {
                console.log('[Playground] No text content in message');
                return;
            }
            const session = await this.prisma.playgroundSession.findUnique({
                where: { id: sessionId },
                include: {
                    agent: true,
                    organization: true
                },
            });
            if (!session || !session.agent) {
                console.error('[Playground] Session or agent not found');
                return;
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const limitSetting = await this.prisma.systemSetting.findUnique({
                where: { key: 'PLAYGROUND_DAILY_MSG_LIMIT' },
            });
            const MESSAGE_LIMIT = parseInt((limitSetting === null || limitSetting === void 0 ? void 0 : limitSetting.value) || '20');
            const messagesCount = await this.prisma.playgroundMessage.count({
                where: {
                    sessionId,
                    sender: 'user',
                    createdAt: {
                        gte: today,
                    },
                },
            });
            console.log(`[Playground] Messages today: ${messagesCount}/${MESSAGE_LIMIT}`);
            if (messagesCount >= MESSAGE_LIMIT) {
                console.log('[Playground] Message limit reached, sending auto-reply');
                await sock.sendMessage(remoteJid, {
                    text: 'Recebemos a tua mensagem, responderemos em breve. ✅',
                });
                await this.prisma.playgroundMessage.create({
                    data: {
                        sessionId,
                        content: text,
                        sender: 'user',
                    },
                });
                return;
            }
            await this.prisma.playgroundMessage.create({
                data: {
                    sessionId,
                    content: text,
                    sender: 'user',
                },
            });
            const provider = await this.prisma.lLMProvider.findFirst({
                where: { isActive: true },
                orderBy: { priority: 'desc' },
            });
            if (!provider) {
                console.error('[Playground] No active LLM provider found');
                await sock.sendMessage(remoteJid, {
                    text: 'Desculpe, nenhum provedor de IA está configurado no momento.',
                });
                return;
            }
            await sock.sendPresenceUpdate('composing', remoteJid);
            const whatsappNumber = remoteJid.split('@')[0];
            console.log('[Playground] Fetching conversation history for:', whatsappNumber);
            const history = await this.prisma.playgroundMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
            const sortedHistory = history.reverse();
            let historyContext = '';
            if (sortedHistory.length > 0) {
                historyContext = sortedHistory.map(msg => {
                    const role = msg.sender === 'user' ? 'User' : 'Assistant';
                    return `${role}: ${msg.content}`;
                }).join('\n');
                console.log(`[Playground] Found ${sortedHistory.length} history messages`);
            }
            const historyPrompt = historyContext ? `\n\nConversation History:\n${historyContext}` : '';
            const fullSystemPrompt = session.agent.prompt + historyPrompt;
            const response = await this.llmService.generateResponse(provider, fullSystemPrompt, text, undefined, session.organizationId, session.agentId);
            await sock.sendPresenceUpdate('paused', remoteJid);
            await sock.sendMessage(remoteJid, { text: response });
            await this.prisma.playgroundMessage.create({
                data: {
                    sessionId,
                    content: response,
                    sender: 'agent',
                },
            });
            console.log('[Playground] Message processed successfully');
        }
        catch (error) {
            console.error('[Playground] Error handling message:', error);
        }
    }
    async getSessionStatus(sessionId) {
        const session = await this.prisma.playgroundSession.findUnique({
            where: { id: sessionId },
            select: { status: true, qrCode: true },
        });
        return session;
    }
    async disconnectSession(sessionId) {
        const sock = this.sessions.get(sessionId);
        if (sock) {
            try {
                await sock.logout();
            }
            catch (error) {
                console.error('[Playground] Error logging out:', error);
            }
            this.sessions.delete(sessionId);
        }
        await this.prisma.playgroundSession.update({
            where: { id: sessionId },
            data: { status: 'DISCONNECTED', qrCode: null },
        });
        const sessionDir = path.join(__dirname, '../../sessions', sessionId);
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }
    }
    async deleteSession(sessionId) {
        try {
            console.log(`[Playground] Deleting session: ${sessionId}`);
            const sock = this.sessions.get(sessionId);
            if (sock) {
                try {
                    await sock.end();
                }
                catch (error) {
                    console.error('[Playground] Error closing socket:', error);
                }
                this.sessions.delete(sessionId);
            }
            const sessionDir = path.join(__dirname, '../../sessions', sessionId);
            if (fs.existsSync(sessionDir)) {
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log(`[Playground] Deleted session directory: ${sessionDir}`);
                }
                catch (error) {
                    console.error('[Playground] Error deleting session directory:', error);
                }
            }
            console.log(`[Playground] Session deleted successfully: ${sessionId}`);
        }
        catch (error) {
            console.error(`[Playground] Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }
};
exports.PlaygroundWhatsAppService = PlaygroundWhatsAppService;
exports.PlaygroundWhatsAppService = PlaygroundWhatsAppService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => llm_service_1.LLMService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LLMService])
], PlaygroundWhatsAppService);
//# sourceMappingURL=playground-whatsapp.service.js.map