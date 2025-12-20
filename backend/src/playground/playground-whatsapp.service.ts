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
        @Inject(PrismaService) private prisma: PrismaService,
        @Inject(forwardRef(() => LLMService))
        private llmService: LLMService,
    ) { }

    private retryCounts = new Map<string, number>();

    async createSession(sessionId: string) {
        const sessionDir = path.join(__dirname, '../../sessions', sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        // Close existing socket if any to prevent conflict
        const existingSock = this.sessions.get(sessionId);
        if (existingSock) {
            try {
                existingSock.ws?.close();
                existingSock.end(undefined);
            } catch (e) {
                console.log(`[Playground] Ignored error during socket cleanup for ${sessionId}: ${(e as any)?.message}`);
            }
            this.sessions.delete(sessionId);
        }

        // Check for DNS/Network connectivity before attempting socket creation
        try {
            await new Promise((resolve, reject) => {
                require('dns').lookup('web.whatsapp.com', (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        } catch (dnsError) {
            console.error(`[Playground] DNS Error looking up web.whatsapp.com: ${dnsError}`);
            setTimeout(() => this.createSession(sessionId), 5000);
            return;
        }

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: ['SaaS AI Agent (Playground)', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
            retryRequestDelayMs: 2000,
        });

        this.sessions.set(sessionId, sock);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                // Reset retries on new QR
                this.retryCounts.set(sessionId, 0);
                await this.prisma.playgroundSession.update({
                    where: { id: sessionId },
                    data: { qrCode: qr, status: 'QR_READY' },
                });
            }

            if (connection === 'close') {
                const boomError = (lastDisconnect?.error as Boom)?.output;
                const statusCode = boomError?.statusCode;
                const errorMessage = (lastDisconnect?.error as any)?.message || '';

                // Conflict: 515 OR 'conflict' in message
                // CRITIAL FIX: Even if status is 401, if message has 'conflict', treat as Conflict (Retryable)
                const isConflict = statusCode === 515 || errorMessage.includes('conflict');

                // LoggedOut: 401 or loggedOut, BUT NOT if it's a conflict
                const isLoggedOut = (statusCode === DisconnectReason.loggedOut || statusCode === 401) && !isConflict;

                console.log(`[Playground] Connection closed: ${lastDisconnect?.error}, statusCode: ${statusCode}, Error: ${errorMessage}`);

                let shouldRetry = true;

                if (isLoggedOut) {
                    console.log(`[Playground] Fatal Logout detected (Status ${statusCode}). No conflict message.`);
                    shouldRetry = false;
                }

                if (shouldRetry) {
                    const currentRetries = this.retryCounts.get(sessionId) || 0;

                    if (isConflict) {
                        if (currentRetries >= 5) {
                            console.log(`[Playground] Max retries (${currentRetries}) reached for Conflict (${statusCode}). Giving up.`);
                            shouldRetry = false;
                        } else {
                            console.log(`[Playground] Conflict detected (Status ${statusCode}). Retry ${currentRetries + 1}/5...`);
                            this.retryCounts.set(sessionId, currentRetries + 1);
                            const delay = Math.floor(Math.random() * 2000) + 1000;
                            setTimeout(() => this.createSession(sessionId), delay);
                            return;
                        }
                    } else {
                        // Normal reconnect
                        console.log(`[Playground] Transient error (Status ${statusCode}). Reconnecting now.`);
                        this.createSession(sessionId);
                        return;
                    }
                }

                if (!shouldRetry) {
                    try {
                        await this.prisma.playgroundSession.update({
                            where: { id: sessionId },
                            data: { status: 'DISCONNECTED' },
                        });

                        // If fatal error, cleanup
                        if (isLoggedOut || (isConflict && (this.retryCounts.get(sessionId) || 0) >= 5)) {
                            console.log(`[Playground] Cleaning up session files for ${sessionId} due to fatal error.`);
                            this.deleteSession(sessionId).catch(e => console.error('Failed to cleanup session files', e));
                            this.retryCounts.delete(sessionId);
                        }
                    } catch (e) {
                        console.log(`[Playground] Could not update session ${sessionId} (might be deleted)`);
                    }
                    this.sessions.delete(sessionId);
                }
            } else if (connection === 'open') {
                console.log('[Playground] Connection opened for session:', sessionId);
                // Reset retries
                this.retryCounts.set(sessionId, 0);
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
            try {
                await sock.sendPresenceUpdate('composing', remoteJid);
            } catch (e) {
                console.log('[Playground] Failed to send presence update (composing):', (e as any)?.message);
            }

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
            try {
                await sock.sendPresenceUpdate('paused', remoteJid);
            } catch (e) {
                console.log('[Playground] Failed to send presence update (paused):', (e as any)?.message);
            }

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
