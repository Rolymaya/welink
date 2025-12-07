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
var PlaygroundService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaygroundService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const prisma_service_1 = require("../prisma/prisma.service");
const llm_service_1 = require("../llm/llm.service");
const playground_whatsapp_service_1 = require("./playground-whatsapp.service");
let PlaygroundService = PlaygroundService_1 = class PlaygroundService {
    constructor(prisma, llmService, schedulerRegistry, playgroundWhatsappService) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.schedulerRegistry = schedulerRegistry;
        this.playgroundWhatsappService = playgroundWhatsappService;
        this.logger = new common_1.Logger(PlaygroundService_1.name);
    }
    async onModuleInit() {
        await this.setupCleanupJob();
    }
    async setupCleanupJob() {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'PLAYGROUND_CLEANUP_SCHEDULE' },
        });
        const cronExpression = (setting === null || setting === void 0 ? void 0 : setting.value) || '0 3 * * *';
        try {
            try {
                const existingJob = this.schedulerRegistry.getCronJob('playground-cleanup');
                existingJob.stop();
                this.schedulerRegistry.deleteCronJob('playground-cleanup');
            }
            catch (e) {
            }
            const job = new cron_1.CronJob(cronExpression, () => {
                this.logger.log('Running scheduled playground cleanup...');
                this.cleanupOldData();
            });
            this.schedulerRegistry.addCronJob('playground-cleanup', job);
            job.start();
            this.logger.log(`Playground cleanup scheduled with cron: ${cronExpression}`);
        }
        catch (error) {
            this.logger.error(`Failed to setup cleanup job: ${error.message}`);
        }
    }
    async createPlaygroundAgent(organizationId, dto) {
        const limitCheck = await this.checkAgentCreationLimit(organizationId);
        if (!limitCheck.allowed) {
            throw new common_1.BadRequestException(`Limite de agentes de teste atingido (${limitCheck.used}/${limitCheck.limit})`);
        }
        return this.prisma.playgroundAgent.create({
            data: Object.assign(Object.assign({}, dto), { organizationId }),
        });
    }
    async getPlaygroundAgents(organizationId) {
        return this.prisma.playgroundAgent.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPlaygroundAgent(id, organizationId) {
        const agent = await this.prisma.playgroundAgent.findFirst({
            where: { id, organizationId },
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agente de teste não encontrado');
        }
        return agent;
    }
    async updatePlaygroundAgent(id, organizationId, dto) {
        await this.getPlaygroundAgent(id, organizationId);
        return this.prisma.playgroundAgent.update({
            where: { id },
            data: dto,
        });
    }
    async deletePlaygroundAgent(id, organizationId) {
        await this.getPlaygroundAgent(id, organizationId);
        return this.prisma.playgroundAgent.delete({
            where: { id },
        });
    }
    async createPlaygroundSession(userId, agentId, organizationId) {
        if (!userId || !agentId || !organizationId) {
            throw new common_1.BadRequestException('Missing required parameters: userId, agentId, or organizationId');
        }
        await this.getPlaygroundAgent(agentId, organizationId);
        const session = await this.prisma.playgroundSession.create({
            data: {
                userId,
                agentId,
                organizationId,
                status: 'CONNECTING',
                qrCode: null,
            },
            include: {
                agent: true,
            },
        });
        try {
            await this.playgroundWhatsappService.createSession(session.id);
            this.logger.log(`Created real WhatsApp session for playground: ${session.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to create WhatsApp session: ${error.message}`);
            await this.prisma.playgroundSession.update({
                where: { id: session.id },
                data: { status: 'DISCONNECTED' },
            });
            throw new common_1.BadRequestException('Failed to initialize WhatsApp session');
        }
        return session;
    }
    async getPlaygroundSessions(organizationId) {
        return this.prisma.playgroundSession.findMany({
            where: { organizationId },
            include: {
                agent: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPlaygroundSessionsByAgent(agentId, organizationId) {
        return this.prisma.playgroundSession.findMany({
            where: { agentId, organizationId },
            include: {
                agent: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPlaygroundSessionStatus(id, organizationId) {
        const session = await this.prisma.playgroundSession.findFirst({
            where: { id, organizationId },
            include: { agent: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
        }
        const whatsappStatus = await this.playgroundWhatsappService.getSessionStatus(id);
        return Object.assign(Object.assign({}, session), { whatsappStatus });
    }
    async disconnectPlaygroundSession(id, organizationId) {
        const session = await this.prisma.playgroundSession.findFirst({
            where: { id, organizationId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
        }
        await this.playgroundWhatsappService.disconnectSession(id);
        this.logger.log(`Disconnected playground session: ${id}`);
        return { message: 'Sessão desconectada com sucesso' };
    }
    async deletePlaygroundSession(id, organizationId) {
        const session = await this.prisma.playgroundSession.findFirst({
            where: { id, organizationId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
        }
        await this.playgroundWhatsappService.deleteSession(id);
        await this.prisma.playgroundSession.delete({
            where: { id },
        });
        this.logger.log(`Deleted playground session: ${id}`);
        return { message: 'Sessão excluída com sucesso' };
    }
    async sendPlaygroundMessage(sessionId, content, organizationId) {
        const session = await this.prisma.playgroundSession.findFirst({
            where: { id: sessionId, organizationId },
            include: { agent: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
        }
        const limitCheck = await this.checkDailyMessageLimit(organizationId);
        if (!limitCheck.allowed) {
            throw new common_1.BadRequestException(`Limite diário de mensagens atingido (${limitCheck.used}/${limitCheck.limit})`);
        }
        await this.prisma.playgroundMessage.create({
            data: {
                sessionId,
                content,
                sender: 'user',
            },
        });
        const messages = await this.prisma.playgroundMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
        const provider = await this.prisma.lLMProvider.findFirst({
            where: { isActive: true },
            orderBy: { priority: 'desc' },
        });
        if (!provider) {
            throw new common_1.BadRequestException('Nenhum provedor de LLM configurado');
        }
        const lastUserMessage = content;
        const response = await this.llmService.generateResponse(provider, session.agent.prompt, lastUserMessage, undefined, organizationId, session.agentId);
        const agentMessage = await this.prisma.playgroundMessage.create({
            data: {
                sessionId,
                content: response,
                sender: 'agent',
            },
        });
        return agentMessage;
    }
    async getPlaygroundMessages(sessionId, organizationId) {
        const session = await this.prisma.playgroundSession.findFirst({
            where: { id: sessionId, organizationId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada');
        }
        return this.prisma.playgroundMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async checkAgentCreationLimit(organizationId) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'PLAYGROUND_MAX_AGENTS_PER_ORG' },
        });
        const limit = parseInt((setting === null || setting === void 0 ? void 0 : setting.value) || '1');
        const used = await this.prisma.playgroundAgent.count({
            where: { organizationId },
        });
        return {
            allowed: used < limit,
            used,
            limit,
        };
    }
    async checkDailyMessageLimit(organizationId) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'PLAYGROUND_DAILY_MSG_LIMIT' },
        });
        const limit = parseInt((setting === null || setting === void 0 ? void 0 : setting.value) || '200');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const used = await this.prisma.playgroundMessage.count({
            where: {
                session: {
                    organizationId,
                },
                createdAt: {
                    gte: today,
                },
            },
        });
        return {
            allowed: used < limit,
            used,
            limit,
            remaining: limit - used,
        };
    }
    async getLimits(organizationId) {
        const [agentLimit, messageLimit] = await Promise.all([
            this.checkAgentCreationLimit(organizationId),
            this.checkDailyMessageLimit(organizationId),
        ]);
        return {
            agents: {
                used: agentLimit.used,
                limit: agentLimit.limit,
                canCreate: agentLimit.allowed,
            },
            messages: {
                used: messageLimit.used,
                limit: messageLimit.limit,
                remaining: messageLimit.remaining,
            },
        };
    }
    async cleanupOldData() {
        this.logger.log('[Playground Cleanup] Starting cleanup job...');
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'PLAYGROUND_RETENTION_DAYS' },
        });
        const retentionDays = parseInt((setting === null || setting === void 0 ? void 0 : setting.value) || '7');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        this.logger.log(`[Playground Cleanup] Deleting sessions older than ${retentionDays} days (before ${cutoffDate.toISOString()})`);
        const result = await this.prisma.playgroundSession.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
        this.logger.log(`[Playground Cleanup] Deleted ${result.count} old playground sessions`);
        return { deleted: result.count };
    }
};
exports.PlaygroundService = PlaygroundService;
exports.PlaygroundService = PlaygroundService = PlaygroundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LLMService,
        schedule_1.SchedulerRegistry,
        playground_whatsapp_service_1.PlaygroundWhatsAppService])
], PlaygroundService);
//# sourceMappingURL=playground.service.js.map