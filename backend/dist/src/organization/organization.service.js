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
exports.OrganizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
let OrganizationService = class OrganizationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto, logoFile) {
        const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + (0, uuid_1.v4)().substring(0, 4);
        let logoUrl = undefined;
        if (logoFile) {
            const base64 = logoFile.buffer.toString('base64');
            logoUrl = `data:${logoFile.mimetype};base64,${base64}`;
        }
        const organization = await this.prisma.organization.create({
            data: {
                name: dto.name,
                slug,
                logo: logoUrl,
                sector: dto.sector,
                description: dto.description,
                users: {
                    connect: { id: userId },
                },
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: 'COMPANY_ADMIN' },
        });
        return organization;
    }
    async findAll() {
        return this.prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        agents: true,
                    },
                },
                agents: {
                    select: {
                        _count: {
                            select: {
                                sessions: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return org;
    }
    async update(id, dto) {
        return this.prisma.organization.update({
            where: { id },
            data: Object.assign(Object.assign({}, dto), { businessHours: dto.businessHours ? JSON.parse(JSON.stringify(dto.businessHours)) : undefined }),
        });
    }
    async uploadLogo(id, file) {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        return this.prisma.organization.update({
            where: { id },
            data: { logo: dataUrl },
        });
    }
    async getDashboardStats(orgId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const totalAgents = await this.prisma.agent.count({
            where: { organizationId: orgId }
        });
        const activeAgents = await this.prisma.agent.count({
            where: { organizationId: orgId, isActive: true }
        });
        const messagesToday = await this.prisma.message.count({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                session: {
                    agent: {
                        organizationId: orgId
                    }
                }
            }
        });
        const totalSessions = await this.prisma.session.count({
            where: {
                agent: {
                    organizationId: orgId
                }
            }
        });
        const connectedSessions = await this.prisma.session.count({
            where: {
                agent: {
                    organizationId: orgId
                },
                status: 'CONNECTED'
            }
        });
        const upcomingAppointments = await this.prisma.agenda.count({
            where: {
                organizationId: orgId,
                date: {
                    gte: today
                }
            }
        });
        const recentMessages = await this.prisma.message.findMany({
            where: {
                session: {
                    agent: {
                        organizationId: orgId
                    }
                },
                role: 'USER'
            },
            include: {
                contact: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });
        return {
            agents: {
                total: totalAgents,
                active: activeAgents,
                paused: totalAgents - activeAgents
            },
            messages: {
                today: messagesToday
            },
            sessions: {
                total: totalSessions,
                connected: connectedSessions
            },
            upcomingAppointments,
            recentActivity: recentMessages.map(msg => {
                var _a, _b;
                return ({
                    id: msg.id,
                    contactName: ((_a = msg.contact) === null || _a === void 0 ? void 0 : _a.name) || 'Desconhecido',
                    contactPhone: ((_b = msg.contact) === null || _b === void 0 ? void 0 : _b.phone) || '',
                    content: msg.content.substring(0, 100),
                    createdAt: msg.createdAt
                });
            })
        };
    }
    async completeOnboarding(id) {
        return this.prisma.organization.update({
            where: { id },
            data: { onboarded: true },
        });
    }
};
exports.OrganizationService = OrganizationService;
exports.OrganizationService = OrganizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationService);
//# sourceMappingURL=organization.service.js.map