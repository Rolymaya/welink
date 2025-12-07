import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
export declare class WhatsAppController {
    private readonly whatsappService;
    private readonly prisma;
    constructor(whatsappService: WhatsAppService, prisma: PrismaService);
    createSession(req: any, dto: CreateSessionDto): Promise<{
        sessionId: string;
        message: string;
    }>;
    getSessions(req: any, agentId?: string): Promise<({
        agent: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SessionType;
        agentId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        qrCode: string | null;
    })[]>;
    startSession(id: string, req: any): Promise<{
        message: string;
    }>;
    getStatus(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SessionType;
        agentId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        qrCode: string | null;
    }>;
    disconnectSession(id: string, req: any): Promise<{
        message: string;
    }>;
    deleteSession(id: string, req: any): Promise<{
        message: string;
    }>;
}
