import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { LLMService } from '../llm/llm.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';
import { OpenAIIntegrationService } from '../llm/openai-integration.service';

@Injectable()
export class AgentService {
    constructor(
        @Inject(PrismaService) private prisma: PrismaService,
        @Inject(LLMService) private llmService: LLMService,
        @Inject(LLMProviderService) private llmProviderService: LLMProviderService,
        @Inject(OpenAIIntegrationService) private openaiIntegration: OpenAIIntegrationService,
    ) { }

    async create(orgId: string, createAgentDto: CreateAgentDto) {
        const agent = await this.prisma.agent.create({
            data: {
                ...createAgentDto,
                organizationId: orgId,
            },
        });

        // Sync with OpenAI Assistant
        try {
            await this.openaiIntegration.syncAssistant(agent.id);
        } catch (error) {
            console.error(`[AgentService] Failed to sync assistant ${agent.id} with OpenAI:`, error.message);
        }

        return agent;
    }

    async findAll(orgId: string) {
        return this.prisma.agent.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, orgId: string) {
        const agent = await this.prisma.agent.findUnique({
            where: { id },
        });

        if (!agent) {
            throw new NotFoundException('Agente não encontrado');
        }

        if (agent.organizationId !== orgId) {
            throw new ForbiddenException('Acesso negado');
        }

        return agent;
    }

    async update(id: string, orgId: string, updateAgentDto: UpdateAgentDto) {
        // Verify ownership
        await this.findOne(id, orgId);

        const updatedAgent = await this.prisma.agent.update({
            where: { id },
            data: updateAgentDto,
        });

        // Sync with OpenAI Assistant
        try {
            await this.openaiIntegration.syncAssistant(id);
        } catch (error) {
            console.error(`[AgentService] Failed to sync assistant ${id} with OpenAI:`, error.message);
        }

        return updatedAgent;
    }

    async remove(id: string, orgId: string) {
        // Verify ownership
        await this.findOne(id, orgId);

        return this.prisma.agent.delete({
            where: { id },
        });
    }

    async chat(id: string, orgId: string, message: string) {
        const agent = await this.findOne(id, orgId);
        const provider = await this.llmProviderService.getActiveProvider();

        if (!provider) {
            throw new NotFoundException('Nenhum provedor de IA ativo encontrado');
        }

        const response = await this.llmService.generateResponse(
            provider,
            agent.prompt,
            message,
            undefined, // No context for simple test chat
            orgId,
            agent.id
        );

        return { response };
    }
}
