import { Controller, Post, Get, Body, Param, UseGuards, Request, Query, UnauthorizedException, Delete } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateSessionDto } from './dto/create-session.dto';
import { LimitGuard, CheckLimit } from '../auth/guards/limit.guard';
import { PlanGuard } from '../auth/guards/plan.guard';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, PlanGuard)
export class WhatsAppController {
    constructor(
        private readonly whatsappService: WhatsAppService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('session/create')
    @UseGuards(LimitGuard)
    @CheckLimit('sessions')
    async createSession(@Request() req, @Body() dto: CreateSessionDto) {
        // 1. Verify agent belongs to user's organization
        const agent = await this.prisma.agent.findUnique({
            where: { id: dto.agentId },
            include: { organization: true },
        });

        if (!agent || agent.organizationId !== req.user.orgId) {
            throw new Error('Agent not found or unauthorized');
        }

        // 2. Create Session in DB
        const session = await this.prisma.session.create({
            data: {
                agentId: dto.agentId,
                status: 'DISCONNECTED',
                type: 'BAILEYS',
            },
        });

        // 3. Initialize Baileys session
        await this.whatsappService.createSession(session.id);

        return { sessionId: session.id, message: 'Session creation started' };
    }

    @Get('sessions')
    async getSessions(@Request() req, @Query('agentId') agentId?: string) {
        console.log('GET /whatsapp/sessions called by user:', req.user);
        if (!req.user?.orgId) {
            throw new UnauthorizedException('User organization not found. Please login again.');
        }

        const where: any = {
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

    @Post('session/:id/start')
    async startSession(@Param('id') id: string, @Request() req) {
        // Verify session belongs to user's organization
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

    @Get('session/:id/status')
    async getStatus(@Param('id') id: string, @Request() req) {
        // Verify session belongs to user's organization
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

    @Post('session/:id/disconnect')
    async disconnectSession(@Param('id') id: string, @Request() req) {
        // Verify session belongs to user's organization
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

    @Delete('session/:id')
    async deleteSession(@Param('id') id: string, @Request() req) {
        try {
            // Verify session belongs to user's organization
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
        } catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    }
}
