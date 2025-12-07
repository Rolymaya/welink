import { Injectable, OnModuleInit } from '@nestjs/common';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import * as qrcode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';
import { LLMService } from '../llm/llm.service';
import { AgendaService } from '../agenda/agenda.service';
import { VectorStoreService } from '../knowledge/vector-store.service';
import { IngestionService } from '../knowledge/ingestion.service';

import { downloadMediaMessage } from '@whiskeysockets/baileys';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class WhatsAppService implements OnModuleInit {
    private sessions = new Map<string, any>(); // sessionId -> socket

    constructor(
        private prisma: PrismaService,
        private agentService: AgentService,
        private knowledgeService: KnowledgeService,
        private llmProviderService: LLMProviderService,
        private llmService: LLMService,
        private agendaService: AgendaService,
        private vectorStoreService: VectorStoreService,
        private ingestionService: IngestionService,
    ) { }

    async onModuleInit() {
        // Auto-restore all CONNECTED sessions on startup (Non-blocking)
        // Add a small delay to ensure DB and other services are fully ready
        setTimeout(() => {
            this.restoreSessions();
        }, 5000);
    }

    private async restoreSessions() {
        console.log('[WhatsApp] Auto-restoring connected sessions...');
        const connectedSessions = await this.prisma.session.findMany({
            where: { status: 'CONNECTED' },
        });

        for (const session of connectedSessions) {
            try {
                console.log(`[WhatsApp] Restoring session: ${session.id}`);
                await this.createSession(session.id);
            } catch (error) {
                console.error(`[WhatsApp] Failed to restore session ${session.id}:`, error);
            }
        }

        console.log(`[WhatsApp] Restored ${connectedSessions.length} session(s)`);
    }

    async createSession(sessionId: string) {
        const sessionDir = path.join(__dirname, '../../sessions', sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['SaaS AI Agent', 'Chrome', '1.0.0'],
        });

        this.sessions.set(sessionId, sock);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                // Update session with QR code (store as text for frontend to render)
                await this.prisma.session.update({
                    where: { id: sessionId },
                    data: { qrCode: qr, status: 'QR_READY' },
                });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                if (shouldReconnect) {
                    this.createSession(sessionId);
                } else {
                    try {
                        await this.prisma.session.update({
                            where: { id: sessionId },
                            data: { status: 'DISCONNECTED' },
                        });
                    } catch (error) {
                        console.error(`Error updating session ${sessionId} to DISCONNECTED:`, error);
                    }
                    this.sessions.delete(sessionId);
                }
            } else if (connection === 'open') {
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

    async handleIncomingMessage(sessionId: string, msg: any) {
        console.log('[WhatsApp] ========== INCOMING MESSAGE ==========');
        console.log('[WhatsApp] SessionId:', sessionId);
        console.log('[WhatsApp] Message key:', msg.key);
        console.log('[WhatsApp] Full message object:', JSON.stringify(msg.message, null, 2));

        const remoteJid = msg.key.remoteJid;

        // Try multiple ways to extract text from different message types
        let text = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption;

        // --- AUDIO TRANSCRIPTION (OpenAI Whisper) ---
        const audioMessage = msg.message?.audioMessage;
        if (audioMessage) {
            console.log('[WhatsApp] Audio message detected. Transcribing...');
            try {
                // 1. Download Audio
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    {
                        logger: console as any,
                        reuploadRequest: (msg) => new Promise((resolve) => resolve(msg)),
                    }
                );

                // 2. Get OpenAI Key
                const provider = await this.llmProviderService.getActiveProvider();
                if (provider && provider.apiKey) {
                    // 3. Send to Whisper
                    const formData = new FormData();
                    formData.append('file', buffer, { filename: 'audio.ogg', contentType: 'audio/ogg' });
                    formData.append('model', 'whisper-1');

                    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                        headers: {
                            ...formData.getHeaders(),
                            Authorization: `Bearer ${provider.apiKey}`,
                        },
                    });

                    if (response.data && (response.data as any).text) {
                        text = (response.data as any).text;
                        console.log(`[WhatsApp] Audio transcribed: "${text}"`);
                    }
                } else {
                    console.warn('[WhatsApp] No active LLM provider found for transcription.');
                }
            } catch (error) {
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

        // 1. Find Agent associated with this session
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

        // 2. Find or create Contact
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

        // 3. Save incoming message
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

        // 4. Get active LLM Provider
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

        // 5. Generate AI response
        console.log('[WhatsApp] Step 5: Generating AI response...');

        // Send "typing..." status
        const sock = this.sessions.get(sessionId);
        if (sock) {
            await sock.sendPresenceUpdate('composing', remoteJid);
        }

        // 4.5 Search Knowledge Base (RAG)
        let context = '';
        try {
            console.log('[WhatsApp] Searching Knowledge Base...');
            const results = await this.knowledgeService.search(text, session.agent.organizationId);
            if (results.length > 0) {
                console.log(`[WhatsApp] Found ${results.length} relevant chunks`);
                context = results.map(r => r.content).join('\n\n');
            } else {
                console.log('[WhatsApp] No relevant knowledge found');
            }
        } catch (error) {
            console.error('[WhatsApp] Knowledge Base search failed:', error);
            // Continue without context
        }

        // 4.6 Fetch Conversation History
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
                take: 10, // Last 10 messages
            });

            // Reverse to chronological order
            const sortedHistory = history.reverse();

            if (sortedHistory.length > 0) {
                historyContext = sortedHistory.map(msg => {
                    const role = msg.role === 'USER' ? 'User' : 'Assistant';
                    return `${role}: ${msg.content}`;
                }).join('\n');
                console.log(`[WhatsApp] Found ${sortedHistory.length} history messages`);
            }
        } catch (error) {
            console.error('[WhatsApp] Failed to fetch history:', error);
        }

        try {
            // Append scheduling instruction
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

            const aiResponse = await this.llmService.generateResponse(
                provider,
                fullSystemPrompt,
                text,
                context, // Pass context to LLM
            );

            console.log('[WhatsApp] AI response generated:', aiResponse.substring(0, 100) + '...');

            // Check for [SCHEDULE] block
            let finalResponse = aiResponse;
            const scheduleRegex = /\[SCHEDULE\]([\s\S]*?)\[\/SCHEDULE\]/;
            const match = aiResponse.match(scheduleRegex);

            if (match) {
                try {
                    const scheduleJson = JSON.parse(match[1]);
                    console.log('[WhatsApp] Detected schedule request:', scheduleJson);

                    // Create Agenda
                    await this.agendaService.create({
                        subject: scheduleJson.subject,
                        date: new Date(scheduleJson.date),
                        summary: scheduleJson.summary,
                        client: contact.name || whatsappNumber,
                        organizationId: session.agent.organizationId,
                        contactId: contact.id,
                    });

                    // Remove the block from the response sent to user
                    finalResponse = aiResponse.replace(scheduleRegex, '').trim();
                } catch (e) {
                    console.error('[WhatsApp] Failed to parse schedule JSON:', e);
                }
            }

            // 6. Send response via WhatsApp
            if (sock) {
                // Stop "typing..." status (optional, sending message usually clears it, but good practice)
                await sock.sendPresenceUpdate('paused', remoteJid);

                await sock.sendMessage(remoteJid, { text: finalResponse });
                console.log('[WhatsApp] Response sent to WhatsApp');

                // 7. Save AI response to DB
                await this.prisma.message.create({
                    data: {
                        content: finalResponse,
                        role: 'ASSISTANT',
                        sessionId,
                        contactId: contact.id,
                    },
                });
                console.log('[WhatsApp] Outgoing message saved');
            } else {
                console.error('[WhatsApp] Socket not found for sessionId:', sessionId);
            }
        } catch (error) {
            console.error('[WhatsApp] Error generating AI response:', error);
            console.error('[WhatsApp] Error stack:', error.stack);

            // Fallback response
            if (sock) {
                await sock.sendPresenceUpdate('paused', remoteJid);
                await sock.sendMessage(remoteJid, {
                    text: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em breve.',
                });
            }
        }

        console.log('[WhatsApp] ========== FINISHED PROCESSING ==========');
    }

    async getSessionStatus(sessionId: string) {
        const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        return session;
    }

    async reconnectSession(sessionId: string) {
        console.log(`[WhatsApp] Reconnecting session: ${sessionId}`);

        // 1. Close existing socket if any (without deleting session files)
        const sock = this.sessions.get(sessionId);
        if (sock) {
            try {
                console.log(`[WhatsApp] Closing existing socket for session: ${sessionId}`);
                await sock.end();
            } catch (error) {
                console.error('[WhatsApp] Error closing socket:', error);
            }
            this.sessions.delete(sessionId);
        }

        // 2. Try to reconnect using existing credentials
        await this.createSession(sessionId);

        console.log(`[WhatsApp] Reconnection initiated for session: ${sessionId}`);
    }

    async disconnectSession(sessionId: string) {
        const sock = this.sessions.get(sessionId);
        if (sock) {
            try {
                await sock.logout();
            } catch (error) {
                console.error('Error logging out:', error);
            }
            this.sessions.delete(sessionId);
        }

        // Update database
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { status: 'DISCONNECTED', qrCode: null },
        });

        // Clean up session files
        const sessionDir = path.join(__dirname, '../../sessions', sessionId);
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }
    }

    async deleteSession(sessionId: string) {
        try {
            console.log(`[WhatsApp] Deleting session: ${sessionId}`);

            // 1. Close socket if exists
            const sock = this.sessions.get(sessionId);
            if (sock) {
                try {
                    await sock.end();
                } catch (error) {
                    console.error('[WhatsApp] Error closing socket during delete:', error);
                }
                this.sessions.delete(sessionId);
            }

            // 2. Clean up session files
            const sessionDir = path.join(__dirname, '../../sessions', sessionId);
            if (fs.existsSync(sessionDir)) {
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log(`[WhatsApp] Deleted session directory: ${sessionDir}`);
                } catch (error) {
                    console.error('[WhatsApp] Error deleting session directory:', error);
                }
            }

            // 3. Delete from database (messages will have sessionId set to null automatically)
            await this.prisma.session.delete({
                where: { id: sessionId },
            });

            console.log(`[WhatsApp] Session deleted successfully: ${sessionId}`);
        } catch (error) {
            console.error(`[WhatsApp] Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }
}
