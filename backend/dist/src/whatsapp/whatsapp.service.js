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
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const baileys_1 = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const agent_service_1 = require("../agent/agent.service");
const knowledge_service_1 = require("../knowledge/knowledge.service");
const llm_provider_service_1 = require("../super-admin/llm-provider.service");
const llm_service_1 = require("../llm/llm.service");
const agenda_service_1 = require("../agenda/agenda.service");
const vector_store_service_1 = require("../knowledge/vector-store.service");
const ingestion_service_1 = require("../knowledge/ingestion.service");
const baileys_2 = require("@whiskeysockets/baileys");
const axios_1 = require("axios");
const FormData = require("form-data");
let WhatsAppService = class WhatsAppService {
    constructor(prisma, agentService, knowledgeService, llmProviderService, llmService, agendaService, vectorStoreService, ingestionService) {
        this.prisma = prisma;
        this.agentService = agentService;
        this.knowledgeService = knowledgeService;
        this.llmProviderService = llmProviderService;
        this.llmService = llmService;
        this.agendaService = agendaService;
        this.vectorStoreService = vectorStoreService;
        this.ingestionService = ingestionService;
        this.sessions = new Map();
    }
    async onModuleInit() {
        setTimeout(() => {
            this.restoreSessions();
        }, 5000);
    }
    async restoreSessions() {
        console.log('[WhatsApp] Auto-restoring connected sessions...');
        const connectedSessions = await this.prisma.session.findMany({
            where: { status: 'CONNECTED' },
        });
        for (const session of connectedSessions) {
            try {
                console.log(`[WhatsApp] Restoring session: ${session.id}`);
                await this.createSession(session.id);
            }
            catch (error) {
                console.error(`[WhatsApp] Failed to restore session ${session.id}:`, error);
            }
        }
        console.log(`[WhatsApp] Restored ${connectedSessions.length} session(s)`);
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
                await this.prisma.session.update({
                    where: { id: sessionId },
                    data: { qrCode: qr, status: 'QR_READY' },
                });
            }
            if (connection === 'close') {
                const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== baileys_1.DisconnectReason.loggedOut;
                console.log('connection closed due to ', lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error, ', reconnecting ', shouldReconnect);
                if (shouldReconnect) {
                    this.createSession(sessionId);
                }
                else {
                    try {
                        await this.prisma.session.update({
                            where: { id: sessionId },
                            data: { status: 'DISCONNECTED' },
                        });
                    }
                    catch (error) {
                        console.error(`Error updating session ${sessionId} to DISCONNECTED:`, error);
                    }
                    this.sessions.delete(sessionId);
                }
            }
            else if (connection === 'open') {
                console.log('opened connection');
                await this.prisma.session.update({
                    where: { id: sessionId },
                    data: { status: 'CONNECTED', qrCode: null },
                });
            }
        });
        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        console.log('replying to', msg.key.remoteJid);
                        this.handleIncomingMessage(sessionId, msg);
                    }
                }
            }
        });
    }
    async handleIncomingMessage(sessionId, msg) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        console.log('[WhatsApp] ========== INCOMING MESSAGE ==========');
        console.log('[WhatsApp] SessionId:', sessionId);
        console.log('[WhatsApp] Message key:', msg.key);
        console.log('[WhatsApp] Full message object:', JSON.stringify(msg.message, null, 2));
        const remoteJid = msg.key.remoteJid;
        let text = ((_a = msg.message) === null || _a === void 0 ? void 0 : _a.conversation) ||
            ((_c = (_b = msg.message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.text) ||
            ((_e = (_d = msg.message) === null || _d === void 0 ? void 0 : _d.imageMessage) === null || _e === void 0 ? void 0 : _e.caption) ||
            ((_g = (_f = msg.message) === null || _f === void 0 ? void 0 : _f.videoMessage) === null || _g === void 0 ? void 0 : _g.caption);
        const audioMessage = (_h = msg.message) === null || _h === void 0 ? void 0 : _h.audioMessage;
        if (audioMessage) {
            console.log('[WhatsApp] Audio message detected. Transcribing...');
            try {
                const buffer = await (0, baileys_2.downloadMediaMessage)(msg, 'buffer', {}, {
                    logger: console,
                    reuploadRequest: (msg) => new Promise((resolve) => resolve(msg)),
                });
                const provider = await this.llmProviderService.getActiveProvider();
                if (provider && provider.apiKey) {
                    const formData = new FormData();
                    formData.append('file', buffer, { filename: 'audio.ogg', contentType: 'audio/ogg' });
                    formData.append('model', 'whisper-1');
                    const response = await axios_1.default.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                        headers: Object.assign(Object.assign({}, formData.getHeaders()), { Authorization: `Bearer ${provider.apiKey}` }),
                    });
                    if (response.data && response.data.text) {
                        text = response.data.text;
                        console.log(`[WhatsApp] Audio transcribed: "${text}"`);
                    }
                }
                else {
                    console.warn('[WhatsApp] No active LLM provider found for transcription.');
                }
            }
            catch (error) {
                console.error('[WhatsApp] Failed to transcribe audio:', error);
            }
        }
        console.log('[WhatsApp] RemoteJid:', remoteJid);
        console.log('[WhatsApp] Extracted text:', text);
        if (!text) {
            console.log('[WhatsApp] No text content, skipping');
            console.log('[WhatsApp] Available message types:', Object.keys(msg.message || {}));
            return;
        }
        console.log(`[WhatsApp] Received message from ${remoteJid}: ${text}`);
        console.log('[WhatsApp] Step 1: Finding session and agent...');
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { agent: { include: { organization: true } } },
        });
        if (!session || !session.agent) {
            console.error(`[WhatsApp] Session or Agent not found for sessionId: ${sessionId}`);
            return;
        }
        console.log('[WhatsApp] Found session and agent:', {
            sessionId: session.id,
            agentId: session.agent.id,
            agentName: session.agent.name,
            orgId: session.agent.organizationId,
            isActive: session.agent.isActive,
        });
        if (!session.agent.isActive) {
            console.log(`[WhatsApp] Agent ${session.agent.name} is paused. Skipping response.`);
            return;
        }
        const whatsappNumber = remoteJid.split('@')[0];
        const organizationId = session.agent.organizationId;
        console.log('[WhatsApp] Step 2: Finding or creating contact...');
        let contact = await this.prisma.contact.findFirst({
            where: {
                phone: whatsappNumber,
                organizationId,
            },
        });
        if (!contact) {
            console.log(`[WhatsApp] Creating new contact: ${whatsappNumber}`);
            contact = await this.prisma.contact.create({
                data: {
                    phone: whatsappNumber,
                    name: msg.pushName || 'Unknown',
                    organizationId,
                    tags: '',
                },
            });
        }
        console.log('[WhatsApp] Contact found/created:', contact.id);
        console.log('[WhatsApp] Step 3: Saving incoming message...');
        await this.prisma.message.create({
            data: {
                content: text,
                role: 'USER',
                sessionId,
                contactId: contact.id,
            },
        });
        console.log('[WhatsApp] Incoming message saved');
        console.log('[WhatsApp] Step 4: Getting active LLM provider...');
        const provider = await this.llmProviderService.getActiveProvider();
        if (!provider) {
            console.error('[WhatsApp] No active LLM provider found');
            return;
        }
        console.log('[WhatsApp] Active LLM provider:', {
            provider: provider.provider,
            model: provider.model,
        });
        console.log('[WhatsApp] Step 5: Generating AI response...');
        const sock = this.sessions.get(sessionId);
        if (sock) {
            await sock.sendPresenceUpdate('composing', remoteJid);
        }
        let context = '';
        try {
            console.log('[WhatsApp] Searching Knowledge Base...');
            const results = await this.knowledgeService.search(text, session.agent.organizationId);
            if (results.length > 0) {
                console.log(`[WhatsApp] Found ${results.length} relevant chunks`);
                context = results.map(r => r.content).join('\n\n');
            }
            else {
                console.log('[WhatsApp] No relevant knowledge found');
            }
        }
        catch (error) {
            console.error('[WhatsApp] Knowledge Base search failed:', error);
        }
        let historyContext = '';
        try {
            console.log('[WhatsApp] Fetching conversation history...');
            const history = await this.prisma.message.findMany({
                where: {
                    sessionId,
                    contactId: contact.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 10,
            });
            const sortedHistory = history.reverse();
            if (sortedHistory.length > 0) {
                historyContext = sortedHistory.map(msg => {
                    const role = msg.role === 'USER' ? 'User' : 'Assistant';
                    return `${role}: ${msg.content}`;
                }).join('\n');
                console.log(`[WhatsApp] Found ${sortedHistory.length} history messages`);
            }
        }
        catch (error) {
            console.error('[WhatsApp] Failed to fetch history:', error);
        }
        try {
            const schedulingInstruction = `
IMPORTANT: You have the capability to schedule meetings, calls, visits, or sales, BUT you must NEVER bring this up unless the user explicitly requests it or clearly indicates a desire to meet/talk later.
If the user DOES ask to schedule or says something like "call me tomorrow" or "can we meet?", then you should help them schedule it.
When the scheduling is confirmed with a specific date and time, you MUST output a special block at the END of your response in the following JSON format:
[SCHEDULE]
{
  "subject": "Meeting/Call/Visit/Sale Subject",
  "date": "YYYY-MM-DD HH:mm",
  "summary": "Brief summary of the agenda"
}
[/SCHEDULE]
The date must be in the future. If the user didn't specify a date, ask for it. Do NOT output this block if the date is not confirmed.
DO NOT ask the user if they want to schedule something unless they have already brought up the topic.
`;
            const historyPrompt = historyContext ? `\n\nConversation History:\n${historyContext}` : '';
            const fullSystemPrompt = session.agent.prompt + historyPrompt + schedulingInstruction;
            const aiResponse = await this.llmService.generateResponse(provider, fullSystemPrompt, text, context);
            console.log('[WhatsApp] AI response generated:', aiResponse.substring(0, 100) + '...');
            let finalResponse = aiResponse;
            const scheduleRegex = /\[SCHEDULE\]([\s\S]*?)\[\/SCHEDULE\]/;
            const match = aiResponse.match(scheduleRegex);
            if (match) {
                try {
                    const scheduleJson = JSON.parse(match[1]);
                    console.log('[WhatsApp] Detected schedule request:', scheduleJson);
                    await this.agendaService.create({
                        subject: scheduleJson.subject,
                        date: new Date(scheduleJson.date),
                        summary: scheduleJson.summary,
                        client: contact.name || whatsappNumber,
                        organizationId: session.agent.organizationId,
                        contactId: contact.id,
                    });
                    finalResponse = aiResponse.replace(scheduleRegex, '').trim();
                }
                catch (e) {
                    console.error('[WhatsApp] Failed to parse schedule JSON:', e);
                }
            }
            if (sock) {
                await sock.sendPresenceUpdate('paused', remoteJid);
                await sock.sendMessage(remoteJid, { text: finalResponse });
                console.log('[WhatsApp] Response sent to WhatsApp');
                await this.prisma.message.create({
                    data: {
                        content: finalResponse,
                        role: 'ASSISTANT',
                        sessionId,
                        contactId: contact.id,
                    },
                });
                console.log('[WhatsApp] Outgoing message saved');
            }
            else {
                console.error('[WhatsApp] Socket not found for sessionId:', sessionId);
            }
        }
        catch (error) {
            console.error('[WhatsApp] Error generating AI response:', error);
            console.error('[WhatsApp] Error stack:', error.stack);
            if (sock) {
                await sock.sendPresenceUpdate('paused', remoteJid);
                await sock.sendMessage(remoteJid, {
                    text: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em breve.',
                });
            }
        }
        console.log('[WhatsApp] ========== FINISHED PROCESSING ==========');
    }
    async getSessionStatus(sessionId) {
        const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        return session;
    }
    async reconnectSession(sessionId) {
        console.log(`[WhatsApp] Reconnecting session: ${sessionId}`);
        const sock = this.sessions.get(sessionId);
        if (sock) {
            try {
                console.log(`[WhatsApp] Closing existing socket for session: ${sessionId}`);
                await sock.end();
            }
            catch (error) {
                console.error('[WhatsApp] Error closing socket:', error);
            }
            this.sessions.delete(sessionId);
        }
        await this.createSession(sessionId);
        console.log(`[WhatsApp] Reconnection initiated for session: ${sessionId}`);
    }
    async disconnectSession(sessionId) {
        const sock = this.sessions.get(sessionId);
        if (sock) {
            try {
                await sock.logout();
            }
            catch (error) {
                console.error('Error logging out:', error);
            }
            this.sessions.delete(sessionId);
        }
        await this.prisma.session.update({
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
            console.log(`[WhatsApp] Deleting session: ${sessionId}`);
            const sock = this.sessions.get(sessionId);
            if (sock) {
                try {
                    await sock.end();
                }
                catch (error) {
                    console.error('[WhatsApp] Error closing socket during delete:', error);
                }
                this.sessions.delete(sessionId);
            }
            const sessionDir = path.join(__dirname, '../../sessions', sessionId);
            if (fs.existsSync(sessionDir)) {
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log(`[WhatsApp] Deleted session directory: ${sessionDir}`);
                }
                catch (error) {
                    console.error('[WhatsApp] Error deleting session directory:', error);
                }
            }
            await this.prisma.session.delete({
                where: { id: sessionId },
            });
            console.log(`[WhatsApp] Session deleted successfully: ${sessionId}`);
        }
        catch (error) {
            console.error(`[WhatsApp] Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_service_1.AgentService,
        knowledge_service_1.KnowledgeService,
        llm_provider_service_1.LLMProviderService,
        llm_service_1.LLMService,
        agenda_service_1.AgendaService,
        vector_store_service_1.VectorStoreService,
        ingestion_service_1.IngestionService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map