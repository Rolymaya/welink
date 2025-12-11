import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlaygroundService } from './playground.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaygroundAgentDto } from './dto/create-playground-agent.dto';
import { UpdatePlaygroundAgentDto } from './dto/update-playground-agent.dto';
import { SendPlaygroundMessageDto } from './dto/send-playground-message.dto';

@Controller('playground')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlaygroundController {
    constructor(
        private playgroundService: PlaygroundService,
        private prisma: PrismaService,
    ) { }

    // Agent Endpoints
    @Post('agents')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    createAgent(@Request() req, @Body() dto: CreatePlaygroundAgentDto) {
        return this.playgroundService.createPlaygroundAgent(req.user.organizationId, dto);
    }

    @Get('agents')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    getAgents(@Request() req) {
        return this.playgroundService.getPlaygroundAgents(req.user.organizationId);
    }

    @Get('agents/:id')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    getAgent(@Request() req, @Param('id') id: string) {
        return this.playgroundService.getPlaygroundAgent(id, req.user.organizationId);
    }

    @Patch('agents/:id')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    updateAgent(@Request() req, @Param('id') id: string, @Body() dto: UpdatePlaygroundAgentDto) {
        return this.playgroundService.updatePlaygroundAgent(id, req.user.organizationId, dto);
    }

    @Delete('agents/:id')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    deleteAgent(@Request() req, @Param('id') id: string) {
        return this.playgroundService.deletePlaygroundAgent(id, req.user.organizationId);
    }

    // Session Endpoints
    @Post('sessions')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    async createSession(@Request() req, @Body() body: { agentId: string }) {
        console.log('[Playground Controller] Creating session:', {
            userId: req.user.id,
            agentId: body.agentId,
            orgId: req.user.organizationId
        });

        try {
            const session = await this.playgroundService.createPlaygroundSession(
                req.user.id,
                body.agentId,
                req.user.organizationId
            );
            console.log('[Playground Controller] Session created successfully:', session.id);
            return session;
        } catch (error) {
            console.error('[Playground Controller] Error creating session:', error);
            throw error;
        }
    }

    @Get('sessions')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    getSessions(@Request() req) {
        const agentId = req.query.agentId;
        if (agentId) {
            return this.playgroundService.getPlaygroundSessionsByAgent(agentId, req.user.organizationId);
        }
        return this.playgroundService.getPlaygroundSessions(req.user.organizationId);
    }

    @Get('sessions/:id/status')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    async getSessionStatus(@Param('id') id: string, @Request() req) {
        return this.playgroundService.getPlaygroundSessionStatus(id, req.user.organizationId);
    }

    @Post('sessions/:id/disconnect')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    async disconnectSession(@Param('id') id: string, @Request() req) {
        return this.playgroundService.disconnectPlaygroundSession(id, req.user.organizationId);
    }

    @Delete('sessions/:id')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    async deleteSession(@Param('id') id: string, @Request() req) {
        return this.playgroundService.deletePlaygroundSession(id, req.user.organizationId);
    }

    // Message Endpoints
    @Post('messages')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    sendMessage(@Request() req, @Body() dto: SendPlaygroundMessageDto) {
        return this.playgroundService.sendPlaygroundMessage(dto.sessionId, dto.content, req.user.organizationId);
    }

    @Get('sessions/:id/messages')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    getMessages(@Request() req, @Param('id') sessionId: string) {
        return this.playgroundService.getPlaygroundMessages(sessionId, req.user.organizationId);
    }

    // Limits Endpoint
    @Get('limits')
    @Roles('COMPANY_ADMIN', 'COMPANY_USER')
    getLimits(@Request() req) {
        return this.playgroundService.getLimits(req.user.organizationId);
    }

    // Cleanup (Manual trigger for Super Admin)
    @Post('cleanup')
    @Roles('SUPER_ADMIN')
    async manualCleanup() {
        return this.playgroundService.cleanupOldData();
    }

    // Update cleanup schedule
    @Post('cleanup/schedule')
    @Roles('SUPER_ADMIN')
    async updateCleanupSchedule(@Body() body: { cronExpression: string }) {
        // Update system setting
        await this.prisma.systemSetting.upsert({
            where: { key: 'PLAYGROUND_CLEANUP_SCHEDULE' },
            update: { value: body.cronExpression },
            create: {
                key: 'PLAYGROUND_CLEANUP_SCHEDULE',
                value: body.cronExpression,
            },
        });

        // Restart cleanup job with new schedule
        await this.playgroundService.setupCleanupJob();

        return { message: 'Agendamento atualizado com sucesso', cronExpression: body.cronExpression };
    }

    // Get cleanup schedule
    @Get('cleanup/schedule')
    @Roles('SUPER_ADMIN')
    async getCleanupSchedule() {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key: 'PLAYGROUND_CLEANUP_SCHEDULE' },
        });

        const cronExpression = setting?.value || '0 3 * * *';

        // Provide human-readable description for common patterns
        const description = this.describeCronExpression(cronExpression);

        return {
            cronExpression,
            description,
        };
    }

    private describeCronExpression(cron: string): string {
        const descriptions: Record<string, string> = {
            '0 * * * *': 'A cada hora',
            '0 */6 * * *': 'A cada 6 horas',
            '0 3 * * *': 'Diariamente às 3h',
            '0 0 * * 0': 'Semanalmente aos domingos',
        };

        return descriptions[cron] || 'Agendamento personalizado';
    }
}
