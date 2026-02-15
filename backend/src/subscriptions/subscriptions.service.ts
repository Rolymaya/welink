import { Injectable, BadRequestException, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApproveSubscriptionDto } from './dto/approve-subscription.dto';
import { EmailService } from '../email/email.service';
import { AffiliatesService } from '../affiliates/affiliates.service';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
    private readonly logger = new Logger(SubscriptionsService.name);

    constructor(
        @Inject(PrismaService) private prisma: PrismaService,
        @Inject(SchedulerRegistry) private schedulerRegistry: SchedulerRegistry,
        @Inject(EmailService) private emailService: EmailService,
        @Inject(AffiliatesService) private affiliatesService: AffiliatesService,
        @Inject(forwardRef(() => require('../whatsapp/whatsapp.service').WhatsAppService))
        private whatsappService: any,
    ) { }

    async onModuleInit() {
        await this.setupExpirationJob();
    }

    private async getSuperAdminEmail(): Promise<string | null> {
        const superAdmin = await this.prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' },
            select: { email: true }
        });
        return superAdmin?.email || null;
    }

    private async sendPurchaseNotification(subscription: any) {
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
                        <li><strong>Banco Selecionado:</strong> ${subscription.bankAccount?.bankName || 'N/A'}</li>
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

        await this.emailService.sendEmail(
            adminEmail,
            `Nova Compra de Pacote - ${subscription.organization.name}`,
            emailHtml
        );
    }

    async create(organizationId: string, dto: CreateSubscriptionDto) {
        // Get package details
        const pkg = await this.prisma.package.findUnique({
            where: { id: dto.packageId },
        });

        if (!pkg || !pkg.isActive) {
            throw new BadRequestException('Package not found or inactive');
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + pkg.durationDays);

        // Create subscription
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

        // Create transaction record
        await this.prisma.transaction.create({
            data: {
                organizationId,
                subscriptionId: subscription.id,
                amount: pkg.price,
                status: 'PENDING',
                type: 'NEW_SUBSCRIPTION',
            },
        });

        // Send notification email to super admin
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

    async findByOrganization(organizationId: string) {
        return this.prisma.subscription.findMany({
            where: { organizationId },
            include: {
                package: true,
                transactions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getActiveSubscription(organizationId: string) {
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

    async approve(id: string, dto: ApproveSubscriptionDto) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
            include: { package: true, organization: true },
        });

        if (!subscription) {
            throw new BadRequestException('Subscription not found');
        }

        // Update subscription status
        const updated = await this.prisma.subscription.update({
            where: { id },
            data: { status: dto.status },
        });

        // Update transaction status and organization limits
        if (dto.status === 'ACTIVE') {
            // 1. Expire any other currently active subscriptions for this organization
            await this.prisma.subscription.updateMany({
                where: {
                    organizationId: subscription.organizationId,
                    status: 'ACTIVE',
                    id: { not: id }, // Exclude the one we just activated
                },
                data: {
                    status: 'EXPIRED',
                    endDate: new Date(), // End it now
                },
            });

            // 2. Update transactions
            await this.prisma.transaction.updateMany({
                where: {
                    subscriptionId: id,
                    status: 'PENDING',
                },
                data: { status: 'COMPLETED' },
            });

            // 3. CRITICAL: Update organization limits with package limits
            await this.prisma.organization.update({
                where: { id: subscription.organizationId },
                data: {
                    plan: subscription.package.name, // Update the plan name
                    maxAgents: subscription.package.maxAgents,
                    maxSessions: subscription.package.maxSessions,
                    maxContacts: subscription.package.maxContacts,
                },
            });

            // 4. Process affiliate commission (if applicable)
            try {
                await this.affiliatesService.processCommission(subscription.organizationId);
            } catch (error) {
                this.logger.warn(`Failed to process affiliate commission: ${error.message}`);
            }
        } else if (dto.status === 'CANCELLED') {
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

    async getUsage(organizationId: string) {
        const [agentCount, sessionCount, contactCount] = await Promise.all([
            this.prisma.agent.count({ where: { organizationId } }),
            this.prisma.session.count({
                where: { agent: { organizationId } },
            }),
            this.prisma.contactDirectory.count({ where: { organizationId } }),
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

    // Cron Job Setup
    async setupExpirationJob() {
        try {
            const setting = await this.prisma.systemSetting?.findUnique({
                where: { key: 'SUBSCRIPTION_EXPIRATION_SCHEDULE' },
            });

            // Default: every day at 1 AM (0 1 * * *)
            const cronExpression = setting?.value || '0 1 * * *';

            try {
                // Remove existing job if it exists
                // Use optional chaining for safe scheduler access just in case
                try {
                    const existingJob = this.schedulerRegistry.getCronJob('subscription-expiration');
                    existingJob.stop();
                    this.schedulerRegistry.deleteCronJob('subscription-expiration');
                } catch (e) {
                    // Job doesn't exist yet, that's fine
                }

                // Create new cron job
                const job = new CronJob(cronExpression, () => {
                    this.logger.log('Running scheduled subscription expiration check...');
                    this.expireSubscriptions();
                });

                this.schedulerRegistry.addCronJob('subscription-expiration', job);
                job.start();

                this.logger.log(`Subscription expiration scheduled with cron: ${cronExpression}`);
            } catch (error) {
                this.logger.error(`Failed to setup expiration job inner: ${error.message}`);
            }
        } catch (error) {
            this.logger.error(`Failed to setup expiration job: ${error.message}`);
        }
    }

    // Expire subscriptions that have passed their endDate
    async expireSubscriptions() {
        this.logger.log('[Subscription Expiration] Starting expiration check...');

        const now = new Date();

        try {
            // Find all ACTIVE subscriptions that have passed their endDate
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

            // Optional: Reset organization limits for expired subscriptions
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

                // Reset limits to default (0 or minimal values)
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

                    // DELETE all active WhatsApp sessions for this organization
                    this.logger.log(`[Subscription Expiration] Deleting active sessions for organization: ${sub.organizationId}`);

                    const sessions = await this.prisma.session.findMany({
                        where: {
                            agent: { organizationId: sub.organizationId },
                            status: 'CONNECTED',
                        },
                    });

                    for (const session of sessions) {
                        try {
                            this.logger.log(`[Subscription Expiration] Deleting session: ${session.id}`);
                            await this.whatsappService.deleteSession(session.id);
                        } catch (error) {
                            this.logger.error(`[Subscription Expiration] Failed to delete session ${session.id}: ${error.message}`);
                        }
                    }
                }

                this.logger.log(`[Subscription Expiration] Reset limits for ${expiredSubs.length} organization(s)`);
            }

            return { expired: result.count };
        } catch (error) {
            this.logger.error(`[Subscription Expiration] Error: ${error.message}`);
            throw error;
        }
    }
}
