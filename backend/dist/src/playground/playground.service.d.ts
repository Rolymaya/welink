import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';
import { PlaygroundWhatsAppService } from './playground-whatsapp.service';
import { CreatePlaygroundAgentDto } from './dto/create-playground-agent.dto';
import { UpdatePlaygroundAgentDto } from './dto/update-playground-agent.dto';
export declare class PlaygroundService implements OnModuleInit {
    private prisma;
    private llmService;
    private schedulerRegistry;
    private playgroundWhatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, llmService: LLMService, schedulerRegistry: SchedulerRegistry, playgroundWhatsappService: PlaygroundWhatsAppService);
    onModuleInit(): Promise<void>;
    setupCleanupJob(): Promise<void>;
    createPlaygroundAgent(organizationId: string, dto: CreatePlaygroundAgentDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    getPlaygroundAgents(organizationId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }[]>;
    getPlaygroundAgent(id: string, organizationId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    updatePlaygroundAgent(id: string, organizationId: string, dto: UpdatePlaygroundAgentDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    deletePlaygroundAgent(id: string, organizationId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    createPlaygroundSession(userId: string, agentId: string, organizationId: string): Promise<{
        agent: {
            id: string;
            name: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            prompt: string;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        agentId: string;
        userId: string;
        status: string;
        qrCode: string | null;
    }>;
    getPlaygroundSessions(organizationId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
        };
        agent: {
            id: string;
            name: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            prompt: string;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        agentId: string;
        userId: string;
        status: string;
        qrCode: string | null;
    })[]>;
    getPlaygroundSessionsByAgent(agentId: string, organizationId: string): Promise<({
        agent: {
            id: string;
            name: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            prompt: string;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        agentId: string;
        userId: string;
        status: string;
        qrCode: string | null;
    })[]>;
    getPlaygroundSessionStatus(id: string, organizationId: string): Promise<{
        whatsappStatus: {
            status: string;
            qrCode: string;
        };
        agent: {
            id: string;
            name: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            prompt: string;
        };
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        agentId: string;
        userId: string;
        status: string;
        qrCode: string | null;
    }>;
    disconnectPlaygroundSession(id: string, organizationId: string): Promise<{
        message: string;
    }>;
    deletePlaygroundSession(id: string, organizationId: string): Promise<{
        message: string;
    }>;
    sendPlaygroundMessage(sessionId: string, content: string, organizationId: string): Promise<{
        id: string;
        createdAt: Date;
        sender: string;
        content: string;
        sessionId: string;
    }>;
    getPlaygroundMessages(sessionId: string, organizationId: string): Promise<{
        id: string;
        createdAt: Date;
        sender: string;
        content: string;
        sessionId: string;
    }[]>;
    checkAgentCreationLimit(organizationId: string): Promise<{
        allowed: boolean;
        used: number;
        limit: number;
    }>;
    checkDailyMessageLimit(organizationId: string): Promise<{
        allowed: boolean;
        used: number;
        limit: number;
        remaining: number;
    }>;
    getLimits(organizationId: string): Promise<{
        agents: {
            used: number;
            limit: number;
            canCreate: boolean;
        };
        messages: {
            used: number;
            limit: number;
            remaining: number;
        };
    }>;
    cleanupOldData(): Promise<{
        deleted: number;
    }>;
}
