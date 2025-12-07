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
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    constructor(prisma, schedulerRegistry, emailService) {
        this.prisma = prisma;
        this.schedulerRegistry = schedulerRegistry;
        this.emailService = emailService;
        this.logger = new common_1.Logger(SubscriptionsService_1.name);
    }
    async onModuleInit() {
        await this.setupExpirationJob();
    }
    async getSuperAdminEmail() {
        const superAdmin = await this.prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' },
            select: { email: true }
        });
        return (superAdmin === null || superAdmin === void 0 ? void 0 : superAdmin.email) || null;
    }
    async sendPurchaseNotification(subscription) {
        var _a;
        const adminEmail = await this.getSuperAdminEmail();
        if (!adminEmail) {
            this.logger.warn('No super admin email found for purchase notification');
            return;
        }
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">Nova Compra de Pacote</h2>
                <p>Uma nova subscrição foi criada e aguarda aprovação.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">Detalhes da Empresa:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Nome:</strong> ${subscription.organization.name}</li>
                        <li><strong>Email:</strong> ${subscription.organization.email || 'N/A'}</li>
                    </ul>
                </div>

                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">Detalhes do Pacote:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Pacote:</strong> ${subscription.package.name}</li>
                        <li><strong>Preço:</strong> ${subscription.package.price} AOA</li>
                        <li><strong>Duração:</strong> ${subscription.package.durationDays} dias</li>
                    </ul>
                </div>

                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">Detalhes do Pagamento:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Banco Selecionado:</strong> ${((_a = subscription.bankAccount) === null || _a === void 0 ? void 0 : _a.bankName) || 'N/A'}</li>
                        <li><strong>Data de Início:</strong> ${new Date(subscription.startDate).toLocaleDateString('pt-PT')}</li>
                        <li><strong>Data de Fim:</strong> ${new Date(subscription.endDate).toLocaleDateString('pt-PT')}</li>
                        <li><strong>Status:</strong> <span style="color: #f59e0b;">Aguardando Pagamento</span></li>
                    </ul>
                </div>

                ${subscription.paymentProofUrl ? `
                    <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <p style="margin: 0;"><strong>Comprovativo de Pagamento:</strong> <a href="${subscription.paymentProofUrl}" style="color: #7c3aed;">Ver Comprovativo</a></p>
                    </div>
                ` : ''}

                <p style="margin-top: 30px; color: #6b7280;">
                    Por favor, acesse o painel de administração para aprovar ou rejeitar esta subscrição.
                </p>
            </div>
        `;
        await this.emailService.sendEmail(adminEmail, `Nova Compra de Pacote - ${subscription.organization.name}`, emailHtml);
    }
    async create(organizationId, dto) {
        const pkg = await this.prisma.package.findUnique({
            where: { id: dto.packageId },
        });
        if (!pkg || !pkg.isActive) {
            throw new common_1.BadRequestException('Package not found or inactive');
        }
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + pkg.durationDays);
        const subscription = await this.prisma.subscription.create({
            data: {
                organizationId,
                packageId: dto.packageId,
                bankAccountId: dto.bankAccountId,
                startDate,
                endDate,
                status: 'PENDING_PAYMENT',
                paymentProofUrl: dto.paymentProofUrl,
            },
            include: {
                package: true,
                organization: true,
                bankAccount: true,
            },
        });
        await this.prisma.transaction.create({
            data: {
                organizationId,
                subscriptionId: subscription.id,
                amount: pkg.price,
                status: 'PENDING',
                type: 'NEW_SUBSCRIPTION',
            },
        });
        await this.sendPurchaseNotification(subscription);
        return subscription;
    }
    async findAll() {
        return this.prisma.subscription.findMany({
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                package: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByOrganization(organizationId) {
        return this.prisma.subscription.findMany({
            where: { organizationId },
            include: {
                package: true,
                transactions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getActiveSubscription(organizationId) {
        return this.prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
                endDate: {
                    gte: new Date(),
                },
            },
            include: {
                package: true,
                organization: true,
            },
        });
    }
    async approve(id, dto) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
            include: { package: true, organization: true },
        });
        if (!subscription) {
            throw new common_1.BadRequestException('Subscription not found');
        }
        const updated = await this.prisma.subscription.update({
            where: { id },
            data: { status: dto.status },
        });
        if (dto.status === 'ACTIVE') {
            await this.prisma.subscription.updateMany({
                where: {
                    organizationId: subscription.organizationId,
                    status: 'ACTIVE',
                    id: { not: id },
                },
                data: {
                    status: 'EXPIRED',
                    endDate: new Date(),
                },
            });
            await this.prisma.transaction.updateMany({
                where: {
                    subscriptionId: id,
                    status: 'PENDING',
                },
                data: { status: 'COMPLETED' },
            });
            await this.prisma.organization.update({
                where: { id: subscription.organizationId },
                data: {
                    plan: subscription.package.name,
                    maxAgents: subscription.package.maxAgents,
                    maxSessions: subscription.package.maxSessions,
                    maxContacts: subscription.package.maxContacts,
                },
            });
        }
        else if (dto.status === 'CANCELLED') {
            await this.prisma.transaction.updateMany({
                where: {
                    subscriptionId: id,
                    status: 'PENDING',
                },
                data: { status: 'FAILED' },
            });
        }
        return updated;
    }
    async getUsage(organizationId) {
        const [agentCount, sessionCount, contactCount] = await Promise.all([
            this.prisma.agent.count({ where: { organizationId } }),
            this.prisma.session.count({
                where: { agent: { organizationId } },
            }),
            this.prisma.contact.count({ where: { organizationId } }),
        ]);
        return {
            agents: agentCount,
            sessions: sessionCount,
            contacts: contactCount,
        };
    }
    async getSettings() {
        const settings = await this.prisma.systemSetting.findMany();
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }
    async setupExpirationJob() {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'SUBSCRIPTION_EXPIRATION_SCHEDULE' },
        });
        const cronExpression = (setting === null || setting === void 0 ? void 0 : setting.value) || '0 1 * * *';
        try {
            try {
                const existingJob = this.schedulerRegistry.getCronJob('subscription-expiration');
                existingJob.stop();
                this.schedulerRegistry.deleteCronJob('subscription-expiration');
            }
            catch (e) {
            }
            const job = new cron_1.CronJob(cronExpression, () => {
                this.logger.log('Running scheduled subscription expiration check...');
                this.expireSubscriptions();
            });
            this.schedulerRegistry.addCronJob('subscription-expiration', job);
            job.start();
            this.logger.log(`Subscription expiration scheduled with cron: ${cronExpression}`);
        }
        catch (error) {
            this.logger.error(`Failed to setup expiration job: ${error.message}`);
        }
    }
    async expireSubscriptions() {
        this.logger.log('[Subscription Expiration] Starting expiration check...');
        const now = new Date();
        try {
            const result = await this.prisma.subscription.updateMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        lt: now,
                    },
                },
                data: {
                    status: 'EXPIRED',
                },
            });
            this.logger.log(`[Subscription Expiration] Expired ${result.count} subscription(s)`);
            if (result.count > 0) {
                const expiredSubs = await this.prisma.subscription.findMany({
                    where: {
                        status: 'EXPIRED',
                        endDate: {
                            lt: now,
                        },
                    },
                    select: {
                        organizationId: true,
                    },
                });
                for (const sub of expiredSubs) {
                    await this.prisma.organization.update({
                        where: { id: sub.organizationId },
                        data: {
                            plan: 'FREE',
                            maxAgents: 0,
                            maxSessions: 0,
                            maxContacts: 0,
                        },
                    });
                }
                this.logger.log(`[Subscription Expiration] Reset limits for ${expiredSubs.length} organization(s)`);
            }
            return { expired: result.count };
        }
        catch (error) {
            this.logger.error(`[Subscription Expiration] Error: ${error.message}`);
            throw error;
        }
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        schedule_1.SchedulerRegistry,
        email_service_1.EmailService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map