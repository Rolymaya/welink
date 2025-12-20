import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationService {
    constructor(@Inject(PrismaService) private prisma: PrismaService) { }

    async create(userId: string, dto: RegisterOrganizationDto, logoFile?: Express.Multer.File, referralCode?: string) {
        // Generate a slug from name
        const slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uuidv4().substring(0, 4);

        let logoUrl = undefined;
        if (logoFile) {
            const base64 = logoFile.buffer.toString('base64');
            logoUrl = `data:${logoFile.mimetype};base64,${base64}`;
        }

        // Create organization
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

        // Update user role to COMPANY_ADMIN
        await this.prisma.user.update({
            where: { id: userId },
            data: { role: 'COMPANY_ADMIN' },
        });

        // Bind to affiliate if referral code provided
        if (referralCode) {
            try {
                const affiliateProfile = await this.prisma.affiliateProfile.findUnique({
                    where: { referralCode },
                });

                if (affiliateProfile) {
                    await this.prisma.affiliateReferral.create({
                        data: {
                            referrerId: affiliateProfile.id,
                            referredOrgId: organization.id,
                            status: 'ACTIVE',
                        },
                    });
                    console.log(`✅ Organization ${organization.id} bound to affiliate ${affiliateProfile.id}`);
                } else {
                    console.warn(`⚠️  Referral code ${referralCode} not found`);
                }
            } catch (error) {
                console.error('Error binding referral:', error);
                // Don't fail organization creation if referral binding fails
            }
        }

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

    async findOne(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        return org;
    }

    async update(id: string, dto: UpdateOrganizationDto) {
        return this.prisma.organization.update({
            where: { id },
            data: {
                ...dto,
                businessHours: dto.businessHours ? JSON.parse(JSON.stringify(dto.businessHours)) : undefined,
            },
        });
    }

    async uploadLogo(id: string, file: Express.Multer.File) {
        // For now, convert to base64 as requested (S3 implementation later)
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;

        return this.prisma.organization.update({
            where: { id },
            data: { logo: dataUrl },
        });
    }

    async getDashboardStats(orgId: string) {
        if (!orgId) {
            return {
                agents: { total: 0, active: 0, paused: 0 },
                messages: { today: 0 },
                sessions: { total: 0, connected: 0 },
                upcomingAppointments: 0,
                recentActivity: []
            };
        }

        // Get today's start and end
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Count total and active agents
        const totalAgents = await this.prisma.agent.count({
            where: { organizationId: orgId }
        });

        const activeAgents = await this.prisma.agent.count({
            where: { organizationId: orgId, isActive: true }
        });

        // Count messages today
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

        // Count WhatsApp sessions
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

        // Count upcoming appointments (from today onwards)
        const upcomingAppointments = await this.prisma.agenda.count({
            where: {
                organizationId: orgId,
                date: {
                    gte: today
                }
            }
        });

        // Get recent activity (last 10 messages)
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
            recentActivity: recentMessages.map(msg => ({
                id: msg.id,
                contactName: msg.contact?.name || 'Desconhecido',
                contactPhone: msg.contact?.phone || '',
                content: msg.content.substring(0, 100),
                createdAt: msg.createdAt
            }))
        };
    }

    async completeOnboarding(id: string) {
        return this.prisma.organization.update({
            where: { id },
            data: { onboarded: true },
        });
    }
}
