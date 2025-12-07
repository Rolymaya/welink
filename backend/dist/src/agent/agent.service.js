"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const llm_service_1 = require("../llm/llm.service");
const llm_provider_service_1 = require("../super-admin/llm-provider.service");
let AgentService = class AgentService {
    constructor(prisma, llmService, llmProviderService) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.llmProviderService = llmProviderService;
    }
    async create(orgId, createAgentDto) {
        return this.prisma.agent.create({
            data: Object.assign(Object.assign({}, createAgentDto), { organizationId: orgId }),
        });
    }
    async findAll(orgId) {
        return this.prisma.agent.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, orgId) {
        const agent = await this.prisma.agent.findUnique({
            where: { id },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agente não encontrado');
        }
        if (agent.organizationId !== orgId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return agent;
    }
    async update(id, orgId, updateAgentDto) {
        await this.findOne(id, orgId);
        return this.prisma.agent.update({
            where: { id },
            data: updateAgentDto,
        });
    }
    async remove(id, orgId) {
        await this.findOne(id, orgId);
        return this.prisma.agent.delete({
            where: { id },
        });
    }
    async chat(id, orgId, message) {
        const agent = await this.findOne(id, orgId);
        const provider = await this.llmProviderService.getActiveProvider();
        if (!provider) {
            throw new common_1.NotFoundException('Nenhum provedor de IA ativo encontrado');
        }
        const response = await this.llmService.generateResponse(provider, agent.prompt, message, undefined, orgId, agent.id);
        return { response };
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LLMService,
        llm_provider_service_1.LLMProviderService])
], AgentService);
//# sourceMappingURL=agent.service.js.map