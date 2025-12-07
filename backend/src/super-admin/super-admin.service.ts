import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLLMProviderDto } from './dto/create-llm-provider.dto';
import { UpdateLLMProviderDto } from './dto/update-llm-provider.dto';
import { PlaygroundService } from '../playground/playground.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class SuperAdminService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => PlaygroundService))
        private playgroundService: PlaygroundService,
        @Inject(forwardRef(() => SubscriptionsService))
        private subscriptionsService: SubscriptionsService,
    ) { }

    async createProvider(data: CreateLLMProviderDto) {
        // In a real app, encrypt apiKey here before saving
        return this.prisma.lLMProvider.create({
            data: {
                ...data,
                // apiKey: encrypt(data.apiKey)
            },
        });
    }

    async findAllProviders() {
        return this.prisma.lLMProvider.findMany({
            orderBy: { priority: 'desc' },
        });
    }

    async updateProvider(id: string, data: UpdateLLMProviderDto) {
        return this.prisma.lLMProvider.update({
            where: { id },
            data,
        });
    }

    async deleteProvider(id: string) {
        return this.prisma.lLMProvider.delete({
            where: { id },
        });
    }

    async getGlobalStats() {
        const [
            totalOrganizations,
            activeSubscriptions,
            totalAgents,
            totalSessions,
            totalRevenueResult,
            pendingPurchases
        ] = await Promise.all([
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

        // Get monthly revenue for the last 6 months
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

        // Process monthly revenue
        const monthlyRevenueMap = new Map<string, number>();
        transactions.forEach(t => {
            const month = t.createdAt.toISOString().slice(0, 7); // YYYY-MM
            const amount = Number(t.amount);
            monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) || 0) + amount);
        });

        const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Get messages by organization for current month
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

        // Get organization info for each contact
        const orgMessageCounts = await Promise.all(
            messagesByOrg.map(async (item) => {
                const contact = await this.prisma.contact.findUnique({
                    where: { id: item.contactId },
                    include: {
                        organization: {
                            select: { name: true }
                        }
                    }
                });
                return {
                    organizationName: contact?.organization?.name || 'Desconhecido',
                    organizationId: contact?.organizationId,
                    count: item._count
                };
            })
        );

        // Aggregate by organization
        const orgMap = new Map<string, { name: string, count: number }>();
        orgMessageCounts.forEach(item => {
            if (item.organizationId) {
                const existing = orgMap.get(item.organizationId);
                if (existing) {
                    existing.count += item.count;
                } else {
                    orgMap.set(item.organizationId, {
                        name: item.organizationName,
                        count: item.count
                    });
                }
            }
        });

        const messagesByOrganization = Array.from(orgMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 organizations

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
        // Convert array to object for easier frontend consumption
        return settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    async updateSettings(settings: Record<string, string>) {
        const updates = Object.entries(settings).map(([key, value]) => {
            return this.prisma.systemSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        });

        await Promise.all(updates);

        // If cleanup schedule was updated, restart the job
        if (settings['PLAYGROUND_CLEANUP_SCHEDULE']) {
            await this.playgroundService.setupCleanupJob();
        }

        // If subscription expiration schedule was updated, restart the job
        if (settings['SUBSCRIPTION_EXPIRATION_SCHEDULE']) {
            await this.subscriptionsService.setupExpirationJob();
        }

        return this.getSettings();
    }
}
