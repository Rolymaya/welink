import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';
export declare class PlaygroundWhatsAppService {
    private prisma;
    private llmService;
    private sessions;
    constructor(prisma: PrismaService, llmService: LLMService);
    createSession(sessionId: string): Promise<void>;
    private handleIncomingMessage;
    getSessionStatus(sessionId: string): Promise<{
        status: string;
        qrCode: string;
    }>;
    disconnectSession(sessionId: string): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
}
