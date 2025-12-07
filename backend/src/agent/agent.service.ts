import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { LLMService } from '../llm/llm.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';

@Injectable()
export class AgentService {
    constructor(
        private prisma: PrismaService,
        private llmService: LLMService,
        private llmProviderService: LLMProviderService,
    ) { }

    async create(orgId: string, createAgentDto: CreateAgentDto) {
        return this.prisma.agent.create({
            data: {
                ...createAgentDto,
                organizationId: orgId,
            },
        });
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

        return this.prisma.agent.update({
            where: { id },
            data: updateAgentDto,
        });
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
