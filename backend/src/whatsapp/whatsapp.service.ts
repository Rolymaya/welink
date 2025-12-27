import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
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
import { AgentToolsService } from '../agent/agent-tools.service';
import { HybridAgentService } from './hybrid-agent.service';
import { EmailService } from '../email/email.service';

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
        @Inject(forwardRef(() => AgentToolsService))
        private agentToolsService: AgentToolsService,
        private hybridAgent: HybridAgentService,
        private emailService: EmailService,
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
                    // Skip messages sent by us
                    if (msg.key.fromMe) {
                        continue;
                    }

                    const remoteJid = msg.key.remoteJid;

                    // Log for debugging
                    console.log('[WhatsApp] Received message:', {
                        remoteJid,
                        participant: msg.key.participant,
                        fromMe: msg.key.fromMe,
                        messageType: Object.keys(msg.message || {})[0]
                    });

                    // Check if it's a private chat
                    // Traditional format: @s.whatsapp.net
                    // New LID format: @lid (WhatsApp Channels/Lists)
                    // Groups: @g.us
                    // Broadcasts: @broadcast
                    const isPrivateChat = remoteJid?.endsWith('@s.whatsapp.net') || remoteJid?.endsWith('@lid');
                    const isGroup = remoteJid?.endsWith('@g.us');
                    const isBroadcast = remoteJid?.includes('@broadcast');

                    if (isPrivateChat) {
                        console.log('[WhatsApp] ✅ Processing private message from:', remoteJid);
                        this.handleIncomingMessage(sessionId, msg);
                    } else if (isGroup) {
                        console.log('[WhatsApp] ⏭️ Ignoring group message from:', remoteJid);
                    } else if (isBroadcast) {
                        console.log('[WhatsApp] ⏭️ Ignoring broadcast message from:', remoteJid);
                    } else {
                        console.log('[WhatsApp] ⚠️ Unknown message type from:', remoteJid);
                    }
                }
            }
        });
    }

    async handleIncomingMessage(sessionId: string, msg: any) {
        console.log('[WhatsApp] ========== INCOMING MESSAGE ==========');
        console.log('[WhatsApp] SessionId:', sessionId);
        console.log('[WhatsApp] Message key:', JSON.stringify(msg.key, null, 2));
        console.log('[WhatsApp] Message info:', JSON.stringify({
            pushName: msg.pushName,
            participant: msg.participant,
            verifiedBizName: msg.verifiedBizName,
        }, null, 2));
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
            isActive: session.agent.isActive,
        });

        // Extract phone number from remoteJid
        // IMPORTANT: When using LID format (@lid), the real phone number is in remoteJidAlt
        // Format examples:
        // - Traditional: remoteJid = "244123456789@s.whatsapp.net"
        // - LID format: remoteJid = "135163359031394@lid", remoteJidAlt = "244945571613@s.whatsapp.net"
        const useRemoteJid = msg.key.remoteJidAlt || remoteJid;
        let whatsappNumber = useRemoteJid.split('@')[0];

        // Log the extraction for debugging
        console.log('[WhatsApp] Phone number extraction:', {
            originalRemoteJid: remoteJid,
            remoteJidAlt: msg.key.remoteJidAlt,
            usedJid: useRemoteJid,
            extractedNumber: whatsappNumber,
            format: remoteJid.includes('@lid') ? 'LID' : 'Traditional'
        });

        const organizationId = session.agent.organizationId;

        // 2. Find or create Contact (ALWAYS, even if agent is disabled)
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

        // 3. Save incoming message (ALWAYS, even if agent is disabled)
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

        // 4. Check if agent is active - if not, stop here
        if (!session.agent.isActive) {
            console.log(`[WhatsApp] Agent ${session.agent.name} is paused. Contact and message saved, but no AI processing.`);
            return;
        }

        // 5. Get active LLM Provider
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

        // 6. Generate AI response
        console.log('[WhatsApp] Step 5: Generating AI response...');

        // Send "typing..." status
        const sock = this.sessions.get(sessionId);
        if (sock) {
            await sock.sendPresenceUpdate('composing', remoteJid);
        }

        // USE HYBRID AGENT ARCHITECTURE
        try {
            const finalResponse = await this.hybridAgent.processMessage(
                text,
                contact.id,
                session.agent.organizationId,
                session.agent.id
            );

            if (sock) {
                await sock.sendPresenceUpdate('paused', remoteJid);
                await sock.sendMessage(remoteJid, { text: finalResponse });
                await this.prisma.message.create({
                    data: { content: finalResponse, role: 'ASSISTANT', sessionId, contactId: contact.id }
                });
            }
        } catch (error) {
            console.error('[WhatsApp] Error:', error);
            if (sock) {
                await sock.sendMessage(remoteJid, { text: 'Desculpe, tive um problema ao processar a sua mensagem.' });
            }
        }

        console.log('[WhatsApp] FINISHED');
        return;

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

        } catch (error) {
            console.error(`[WhatsApp] Error deleting session ${sessionId}:`, error);
            throw error;
        }
    }

    async sendNotification(organizationId: string, phone: string, text: string) {
        console.log(`[WhatsApp] Sending notification to ${phone} for Org: ${organizationId}`);

        // Find a CONNECTED session for this organization
        const session = await this.prisma.session.findFirst({
            where: {
                status: 'CONNECTED',
                agent: {
                    organizationId: organizationId
                }
            }
        });

        if (!session) {
            console.warn(`[WhatsApp] No connected session found for Org ${organizationId}. Cannot send notification.`);
            return false;
        }

        const sock = this.sessions.get(session.id);
        if (!sock) {
            console.error(`[WhatsApp] Socket not found in memory for session ${session.id}`);
            return false;
        }

        try {
            const remoteJid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
            await sock.sendMessage(remoteJid, { text });

            // Log the notification in message history
            await this.prisma.message.create({
                data: {
                    content: text,
                    role: 'ASSISTANT',
                    sessionId: session.id,
                    // We don't necessarily have a contactId here easily without more queries, 
                    // but we can try to find it by phone if needed.
                }
            });

            return true;
        } catch (error) {
            console.error(`[WhatsApp] Failed to send notification:`, error);
            return false;
        }
    }
}
