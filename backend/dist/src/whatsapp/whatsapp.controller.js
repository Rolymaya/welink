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
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const create_session_dto_1 = require("./dto/create-session.dto");
const limit_guard_1 = require("../auth/guards/limit.guard");
const plan_guard_1 = require("../auth/guards/plan.guard");
let WhatsAppController = class WhatsAppController {
    constructor(whatsappService, prisma) {
        this.whatsappService = whatsappService;
        this.prisma = prisma;
    }
    async createSession(req, dto) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: dto.agentId },
            include: { organization: true },
        });
        if (!agent || agent.organizationId !== req.user.orgId) {
            throw new Error('Agent not found or unauthorized');
        }
        const session = await this.prisma.session.create({
            data: {
                agentId: dto.agentId,
                status: 'DISCONNECTED',
                type: 'BAILEYS',
            },
        });
        await this.whatsappService.createSession(session.id);
        return { sessionId: session.id, message: 'Session creation started' };
    }
    async getSessions(req, agentId) {
        var _a;
        console.log('GET /whatsapp/sessions called by user:', req.user);
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.orgId)) {
            throw new common_1.UnauthorizedException('User organization not found. Please login again.');
        }
        const where = {
            agent: {
                organizationId: req.user.orgId,
            },
        };
        if (agentId) {
            where.agentId = agentId;
        }
        return this.prisma.session.findMany({
            where,
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async startSession(id, req) {
        const session = await this.prisma.session.findFirst({
            where: {
                id,
                agent: {
                    organizationId: req.user.orgId,
                },
            },
        });
        if (!session) {
            throw new Error('Session not found or unauthorized');
        }
        await this.whatsappService.reconnectSession(id);
        return { message: 'Session reconnection started' };
    }
    async getStatus(id, req) {
        const session = await this.prisma.session.findFirst({
            where: {
                id,
                agent: {
                    organizationId: req.user.orgId,
                },
            },
        });
        if (!session) {
            throw new Error('Session not found or unauthorized');
        }
        return session;
    }
    async disconnectSession(id, req) {
        const session = await this.prisma.session.findFirst({
            where: {
                id,
                agent: {
                    organizationId: req.user.orgId,
                },
            },
        });
        if (!session) {
            throw new Error('Session not found or unauthorized');
        }
        await this.whatsappService.disconnectSession(id);
        return { message: 'Session disconnected' };
    }
    async deleteSession(id, req) {
        try {
            const session = await this.prisma.session.findFirst({
                where: {
                    id,
                    agent: {
                        organizationId: req.user.orgId,
                    },
                },
            });
            if (!session) {
                throw new Error('Session not found or unauthorized');
            }
            await this.whatsappService.deleteSession(id);
            return { message: 'Session deleted' };
        }
        catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Post)('session/create'),
    (0, common_1.UseGuards)(limit_guard_1.LimitGuard),
    (0, limit_guard_1.CheckLimit)('sessions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Post)('session/:id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "startSession", null);
__decorate([
    (0, common_1.Get)('session/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('session/:id/disconnect'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "disconnectSession", null);
__decorate([
    (0, common_1.Delete)('session/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "deleteSession", null);
exports.WhatsAppController = WhatsAppController = __decorate([
    (0, swagger_1.ApiTags)('whatsapp'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('whatsapp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService,
        prisma_service_1.PrismaService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map