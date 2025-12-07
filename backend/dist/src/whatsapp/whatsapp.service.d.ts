import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';
import { LLMService } from '../llm/llm.service';
import { AgendaService } from '../agenda/agenda.service';
import { VectorStoreService } from '../knowledge/vector-store.service';
import { IngestionService } from '../knowledge/ingestion.service';
export declare class WhatsAppService implements OnModuleInit {
    private prisma;
    private agentService;
    private knowledgeService;
    private llmProviderService;
    private llmService;
    private agendaService;
    private vectorStoreService;
    private ingestionService;
    private sessions;
    constructor(prisma: PrismaService, agentService: AgentService, knowledgeService: KnowledgeService, llmProviderService: LLMProviderService, llmService: LLMService, agendaService: AgendaService, vectorStoreService: VectorStoreService, ingestionService: IngestionService);
    onModuleInit(): Promise<void>;
    private restoreSessions;
    createSession(sessionId: string): Promise<void>;
    handleIncomingMessage(sessionId: string, msg: any): Promise<void>;
    getSessionStatus(sessionId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SessionType;
        agentId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        qrCode: string | null;
    }>;
    reconnectSession(sessionId: string): Promise<void>;
    disconnectSession(sessionId: string): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
}
