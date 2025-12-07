import { PlaygroundService } from './playground.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaygroundAgentDto } from './dto/create-playground-agent.dto';
import { UpdatePlaygroundAgentDto } from './dto/update-playground-agent.dto';
import { SendPlaygroundMessageDto } from './dto/send-playground-message.dto';
export declare class PlaygroundController {
    private playgroundService;
    private prisma;
    constructor(playgroundService: PlaygroundService, prisma: PrismaService);
    createAgent(req: any, dto: CreatePlaygroundAgentDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    getAgents(req: any): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }[]>;
    getAgent(req: any, id: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    updateAgent(req: any, id: string, dto: UpdatePlaygroundAgentDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    deleteAgent(req: any, id: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        prompt: string;
    }>;
    createSession(req: any, body: {
        agentId: string;
    }): Promise<{
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
    getSessions(req: any): Promise<({
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
    getSessionStatus(id: string, req: any): Promise<{
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
    disconnectSession(id: string, req: any): Promise<{
        message: string;
    }>;
    deleteSession(id: string, req: any): Promise<{
        message: string;
    }>;
    sendMessage(req: any, dto: SendPlaygroundMessageDto): Promise<{
        id: string;
        createdAt: Date;
        sender: string;
        content: string;
        sessionId: string;
    }>;
    getMessages(req: any, sessionId: string): Promise<{
        id: string;
        createdAt: Date;
        sender: string;
        content: string;
        sessionId: string;
    }[]>;
    getLimits(req: any): Promise<{
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
    manualCleanup(): Promise<{
        deleted: number;
    }>;
    updateCleanupSchedule(body: {
        cronExpression: string;
    }): Promise<{
        message: string;
        cronExpression: string;
    }>;
    getCleanupSchedule(): Promise<{
        cronExpression: string;
        description: string;
    }>;
    private describeCronExpression;
}
