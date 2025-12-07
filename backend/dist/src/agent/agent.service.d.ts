import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { LLMService } from '../llm/llm.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';
export declare class AgentService {
    private prisma;
    private llmService;
    private llmProviderService;
    constructor(prisma: PrismaService, llmService: LLMService, llmProviderService: LLMProviderService);
    create(orgId: string, createAgentDto: CreateAgentDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    findAll(orgId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }[]>;
    findOne(id: string, orgId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    update(id: string, orgId: string, updateAgentDto: UpdateAgentDto): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    remove(id: string, orgId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        prompt: string;
    }>;
    chat(id: string, orgId: string, message: string): Promise<{
        response: string;
    }>;
}
