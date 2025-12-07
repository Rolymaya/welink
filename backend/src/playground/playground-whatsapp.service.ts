import { Injectable, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';

@Injectable()
export class PlaygroundWhatsAppService {
    private sessions = new Map<string, any>();

    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => LLMService))
        private llmService: LLMService,
    ) { }

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
                await this.prisma.playgroundSession.update({
                    where: { id: sessionId },
                    data: { qrCode: qr, status: 'QR_READY' },
                });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('[Playground] Connection closed:', lastDisconnect?.error, 'reconnecting:', shouldReconnect);

                if (shouldReconnect) {
                    this.createSession(sessionId);
                } else {
                    try {
                        await this.prisma.playgroundSession.update({
                            where: { id: sessionId },
                            data: { status: 'DISCONNECTED' },
                        });
                    } catch (e) {
                        console.log(`[Playground] Could not update session ${sessionId} (might be deleted)`);
                    }
                    this.sessions.delete(sessionId);
                }
            } else if (connection === 'open') {
                console.log('[Playground] Connection opened for session:', sessionId);
                await this.prisma.playgroundSession.update({
                    where: { id: sessionId },
                    data: { status: 'CONNECTED', qrCode: null },
                });
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    // Only process messages that are:
                    // 1. Not from me
                    // 2. From individual chats (not groups or broadcasts)
                    // 3. Not status updates
                    const isFromMe = msg.key.fromMe;
                    const isGroup = msg.key.remoteJid?.endsWith('@g.us');
                    const isBroadcast = msg.key.remoteJid?.endsWith('@broadcast');
                    const isStatus = msg.key.remoteJid === 'status@broadcast';

                    if (!isFromMe && !isGroup && !isBroadcast && !isStatus) {
                        console.log('[Playground] Received message from', msg.key.remoteJid);
                        await this.handleIncomingMessage(sessionId, msg, sock);
                    } else {
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

    private async handleIncomingMessage(sessionId: string, msg: any, sock: any) {
        try {
            console.log('[Playground] Processing incoming message for session:', sessionId);

            const remoteJid = msg.key.remoteJid;
            const text = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption;

            if (!text) {
                console.log('[Playground] No text content in message');
                return;
            }

            // Get session with agent and organization
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

            // Check message limit BEFORE processing (using dynamic limit from settings)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get dynamic limit from system settings
            const limitSetting = await this.prisma.systemSetting.findUnique({
                where: { key: 'PLAYGROUND_DAILY_MSG_LIMIT' },
            });
            const MESSAGE_LIMIT = parseInt(limitSetting?.value || '20');

            // Count only USER messages (received), not agent responses
            const messagesCount = await this.prisma.playgroundMessage.count({
                where: {
                    sessionId,
                    sender: 'user', // Only count messages FROM users
                    createdAt: {
                        gte: today,
                    },
                },
            });

            console.log(`[Playground] Messages today: ${messagesCount}/${MESSAGE_LIMIT}`);

            // If limit reached, send auto-reply WITHOUT calling LLM
            if (messagesCount >= MESSAGE_LIMIT) {
                console.log('[Playground] Message limit reached, sending auto-reply');

                await sock.sendMessage(remoteJid, {
                    text: 'Recebemos a tua mensagem, responderemos em breve. ✅',
                });

                // Save user message but don't process it
                await this.prisma.playgroundMessage.create({
                    data: {
                        sessionId,
                        content: text,
                        sender: 'user',
                    },
                });

                return;
            }

            // Save user message
            await this.prisma.playgroundMessage.create({
                data: {
                    sessionId,
                    content: text,
                    sender: 'user',
                },
            });

            // Get active LLM provider
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

            // Send typing indicator
            await sock.sendPresenceUpdate('composing', remoteJid);

            // Fetch conversation history from database
            const whatsappNumber = remoteJid.split('@')[0];
            console.log('[Playground] Fetching conversation history for:', whatsappNumber);

            const history = await this.prisma.playgroundMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' },
                take: 10, // Last 10 messages
            });

            // Reverse to chronological order and build context
            const sortedHistory = history.reverse();
            let historyContext = '';

            if (sortedHistory.length > 0) {
                historyContext = sortedHistory.map(msg => {
                    const role = msg.sender === 'user' ? 'User' : 'Assistant';
                    return `${role}: ${msg.content}`;
                }).join('\n');
                console.log(`[Playground] Found ${sortedHistory.length} history messages`);
            }

            // Build full system prompt with history
            const historyPrompt = historyContext ? `\n\nConversation History:\n${historyContext}` : '';
            const fullSystemPrompt = session.agent.prompt + historyPrompt;

            // Generate AI response using injected LLMService
            const response = await this.llmService.generateResponse(
                provider,
                fullSystemPrompt,
                text,
                undefined, // no knowledge base context for playground
                session.organizationId,
                session.agentId
            );

            // Stop typing indicator
            await sock.sendPresenceUpdate('paused', remoteJid);

            // Send AI response
            await sock.sendMessage(remoteJid, { text: response });

            // Save AI response
            await this.prisma.playgroundMessage.create({
                data: {
                    sessionId,
                    content: response,
                    sender: 'agent',
                },
            });

            console.log('[Playground] Message processed successfully');
        } catch (error) {
            console.error('[Playground] Error handling message:', error);
        }
    }

    async getSessionStatus(sessionId: string) {
        const session = await this.prisma.playgroundSession.findUnique({
            where: { id: sessionId },
            select: { status: true, qrCode: true },
        });

        return session;
    }

    async disconnectSession(sessionId: string) {
        const sock = this.sessions.get(sessionId);
        if (sock) {
            try {
                await sock.logout();
            } catch (error) {
                console.error('[Playground] Error logging out:', error);
            }
            this.sessions.delete(sessionId);
        }

        await this.prisma.playgroundSession.update({
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
            console.log(`[Playground] Deleting session: ${sessionId}`);

            // Close socket if exists
            const sock = this.sessions.get(sessionId);
            if (sock) {
                try {
                    await sock.end();
                } catch (error) {
                    console.error('[Playground] Error closing socket:', error);
                }
                this.sessions.delete(sessionId);
            }

            // Clean up session files
            const sessionDir = path.join(__dirname, '../../sessions', sessionId);
            if (fs.existsSync(sessionDir)) {
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log(`[Playground] Deleted session directory: ${sessionDir}`);
                } catch (error) {
                    console.error('[Playground] Error deleting session directory:', error);
                }
            }

            console.log(`[Playground] Session deleted successfully: ${sessionId}`);
        } catch (error) {
            console.error(`[Playground] Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }
}
