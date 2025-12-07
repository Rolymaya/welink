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
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const playground_service_1 = require("../playground/playground.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
let SuperAdminService = class SuperAdminService {
    constructor(prisma, playgroundService, subscriptionsService) {
        this.prisma = prisma;
        this.playgroundService = playgroundService;
        this.subscriptionsService = subscriptionsService;
    }
    async createProvider(data) {
        return this.prisma.lLMProvider.create({
            data: Object.assign({}, data),
        });
    }
    async findAllProviders() {
        return this.prisma.lLMProvider.findMany({
            orderBy: { priority: 'desc' },
        });
    }
    async updateProvider(id, data) {
        return this.prisma.lLMProvider.update({
            where: { id },
            data,
        });
    }
    async deleteProvider(id) {
        return this.prisma.lLMProvider.delete({
            where: { id },
        });
    }
    async getGlobalStats() {
        const [totalOrganizations, activeSubscriptions, totalAgents, totalSessions, totalRevenueResult, pendingPurchases] = await Promise.all([
            this.prisma.organization.count(),
            this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            this.prisma.agent.count(),
            this.prisma.session.count(),
            this.prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { status: 'COMPLETED' }
            }),
            this.prisma.subscription.count({ where: { status: 'PENDING_PAYMENT' } })
        ]);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: sixMonthsAgo }
            },
            select: {
                amount: true,
                createdAt: true
            }
        });
        const monthlyRevenueMap = new Map();
        transactions.forEach(t => {
            const month = t.createdAt.toISOString().slice(0, 7);
            const amount = Number(t.amount);
            monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + amount);
        });
        const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const messagesByOrg = await this.prisma.message.groupBy({
            by: ['contactId'],
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            _count: true
        });
        const orgMessageCounts = await Promise.all(messagesByOrg.map(async (item) => {
            var _a;
            const contact = await this.prisma.contact.findUnique({
                where: { id: item.contactId },
                include: {
                    organization: {
                        select: { name: true }
                    }
                }
            });
            return {
                organizationName: ((_a = contact === null || contact === void 0 ? void 0 : contact.organization) === null || _a === void 0 ? void 0 : _a.name) || 'Desconhecido',
                organizationId: contact === null || contact === void 0 ? void 0 : contact.organizationId,
                count: item._count
            };
        }));
        const orgMap = new Map();
        orgMessageCounts.forEach(item => {
            if (item.organizationId) {
                const existing = orgMap.get(item.organizationId);
                if (existing) {
                    existing.count += item.count;
                }
                else {
                    orgMap.set(item.organizationId, {
                        name: item.organizationName,
                        count: item.count
                    });
                }
            }
        });
        const messagesByOrganization = Array.from(orgMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            overview: {
                totalOrganizations,
                activeSubscriptions,
                totalAgents,
                totalSessions,
                totalRevenue: Number(totalRevenueResult._sum.amount || 0),
                pendingPurchases
            },
            charts: {
                monthlyRevenue,
                messagesByOrganization
            }
        };
    }
    async getSettings() {
        const settings = await this.prisma.systemSetting.findMany();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }
    async updateSettings(settings) {
        const updates = Object.entries(settings).map(([key, value]) => {
            return this.prisma.systemSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        });
        await Promise.all(updates);
        if (settings['PLAYGROUND_CLEANUP_SCHEDULE']) {
            await this.playgroundService.setupCleanupJob();
        }
        if (settings['SUBSCRIPTION_EXPIRATION_SCHEDULE']) {
            await this.subscriptionsService.setupExpirationJob();
        }
        return this.getSettings();
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => playground_service_1.PlaygroundService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => subscriptions_service_1.SubscriptionsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        playground_service_1.PlaygroundService,
        subscriptions_service_1.SubscriptionsService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map