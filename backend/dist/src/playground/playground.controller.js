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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaygroundController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const playground_service_1 = require("./playground.service");
const prisma_service_1 = require("../prisma/prisma.service");
const create_playground_agent_dto_1 = require("./dto/create-playground-agent.dto");
const update_playground_agent_dto_1 = require("./dto/update-playground-agent.dto");
const send_playground_message_dto_1 = require("./dto/send-playground-message.dto");
let PlaygroundController = class PlaygroundController {
    constructor(playgroundService, prisma) {
        this.playgroundService = playgroundService;
        this.prisma = prisma;
    }
    createAgent(req, dto) {
        return this.playgroundService.createPlaygroundAgent(req.user.orgId, dto);
    }
    getAgents(req) {
        return this.playgroundService.getPlaygroundAgents(req.user.orgId);
    }
    getAgent(req, id) {
        return this.playgroundService.getPlaygroundAgent(id, req.user.orgId);
    }
    updateAgent(req, id, dto) {
        return this.playgroundService.updatePlaygroundAgent(id, req.user.orgId, dto);
    }
    deleteAgent(req, id) {
        return this.playgroundService.deletePlaygroundAgent(id, req.user.orgId);
    }
    async createSession(req, body) {
        console.log('[Playground Controller] Creating session:', {
            userId: req.user.userId,
            agentId: body.agentId,
            orgId: req.user.orgId
        });
        try {
            const session = await this.playgroundService.createPlaygroundSession(req.user.userId, body.agentId, req.user.orgId);
            console.log('[Playground Controller] Session created successfully:', session.id);
            return session;
        }
        catch (error) {
            console.error('[Playground Controller] Error creating session:', error);
            throw error;
        }
    }
    getSessions(req) {
        const agentId = req.query.agentId;
        if (agentId) {
            return this.playgroundService.getPlaygroundSessionsByAgent(agentId, req.user.orgId);
        }
        return this.playgroundService.getPlaygroundSessions(req.user.orgId);
    }
    async getSessionStatus(id, req) {
        return this.playgroundService.getPlaygroundSessionStatus(id, req.user.orgId);
    }
    async disconnectSession(id, req) {
        return this.playgroundService.disconnectPlaygroundSession(id, req.user.orgId);
    }
    async deleteSession(id, req) {
        return this.playgroundService.deletePlaygroundSession(id, req.user.orgId);
    }
    sendMessage(req, dto) {
        return this.playgroundService.sendPlaygroundMessage(dto.sessionId, dto.content, req.user.orgId);
    }
    getMessages(req, sessionId) {
        return this.playgroundService.getPlaygroundMessages(sessionId, req.user.orgId);
    }
    getLimits(req) {
        return this.playgroundService.getLimits(req.user.orgId);
    }
    async manualCleanup() {
        return this.playgroundService.cleanupOldData();
    }
    async updateCleanupSchedule(body) {
        await this.prisma.systemSetting.upsert({
            where: { key: 'PLAYGROUND_CLEANUP_SCHEDULE' },
            update: { value: body.cronExpression },
            create: {
                key: 'PLAYGROUND_CLEANUP_SCHEDULE',
                value: body.cronExpression,
            },
        });
        await this.playgroundService.setupCleanupJob();
        return { message: 'Agendamento atualizado com sucesso', cronExpression: body.cronExpression };
    }
    async getCleanupSchedule() {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'PLAYGROUND_CLEANUP_SCHEDULE' },
        });
        const cronExpression = (setting === null || setting === void 0 ? void 0 : setting.value) || '0 3 * * *';
        const description = this.describeCronExpression(cronExpression);
        return {
            cronExpression,
            description,
        };
    }
    describeCronExpression(cron) {
        const descriptions = {
            '0 * * * *': 'A cada hora',
            '0 */6 * * *': 'A cada 6 horas',
            '0 3 * * *': 'Diariamente às 3h',
            '0 0 * * 0': 'Semanalmente aos domingos',
        };
        return descriptions[cron] || 'Agendamento personalizado';
    }
};
exports.PlaygroundController = PlaygroundController;
__decorate([
    (0, common_1.Post)('agents'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_playground_agent_dto_1.CreatePlaygroundAgentDto]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "createAgent", null);
__decorate([
    (0, common_1.Get)('agents'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "getAgents", null);
__decorate([
    (0, common_1.Get)('agents/:id'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "getAgent", null);
__decorate([
    (0, common_1.Patch)('agents/:id'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_playground_agent_dto_1.UpdatePlaygroundAgentDto]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "updateAgent", null);
__decorate([
    (0, common_1.Delete)('agents/:id'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "deleteAgent", null);
__decorate([
    (0, common_1.Post)('sessions'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlaygroundController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id/status'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlaygroundController.prototype, "getSessionStatus", null);
__decorate([
    (0, common_1.Post)('sessions/:id/disconnect'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlaygroundController.prototype, "disconnectSession", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlaygroundController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_playground_message_dto_1.SendPlaygroundMessageDto]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('sessions/:id/messages'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('limits'),
    (0, roles_decorator_1.Roles)('COMPANY_ADMIN', 'COMPANY_USER'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PlaygroundController.prototype, "getLimits", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlaygroundController.prototype, "manualCleanup", null);
__decorate([
    (0, common_1.Post)('cleanup/schedule'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlaygroundController.prototype, "updateCleanupSchedule", null);
__decorate([
    (0, common_1.Get)('cleanup/schedule'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlaygroundController.prototype, "getCleanupSchedule", null);
exports.PlaygroundController = PlaygroundController = __decorate([
    (0, common_1.Controller)('playground'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [playground_service_1.PlaygroundService,
        prisma_service_1.PrismaService])
], PlaygroundController);
//# sourceMappingURL=playground.controller.js.map