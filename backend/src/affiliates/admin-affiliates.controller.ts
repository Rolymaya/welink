import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Inject,
} from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/affiliates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminAffiliatesController {
    constructor(@Inject(AffiliatesService) private readonly affiliatesService: AffiliatesService) { }

    /**
     * GET /admin/affiliates/stats
     * Estatísticas globais do sistema de afiliados
     */
    @Get('stats')
    async getGlobalStats() {
        return this.affiliatesService.getGlobalStats();
    }

    /**
     * GET /admin/affiliates/withdrawals
     * Lista pedidos de saque pendentes
     */
    @Get('withdrawals')
    async getPendingWithdrawals() {
        return this.affiliatesService.getPendingWithdrawals();
    }

    /**
     * POST /admin/affiliates/withdrawals/:id/approve
     * Aprovar um saque
     */
    @Post('withdrawals/:id/approve')
    async approveWithdrawal(@Param('id') id: string) {
        return this.affiliatesService.approveWithdrawal(id);
    }

    /**
     * POST /admin/affiliates/withdrawals/:id/reject
     * Rejeitar um saque
     */
    @Post('withdrawals/:id/reject')
    async rejectWithdrawal(
        @Param('id') id: string,
        @Body() body: { reason?: string },
    ) {
        return this.affiliatesService.rejectWithdrawal(id, body.reason);
    }

    /**
     * POST /admin/affiliates/withdrawals/:id/complete
     * Marcar saque como pago (Completar)
     */
    @Post('withdrawals/:id/complete')
    async completeWithdrawal(@Param('id') id: string) {
        return this.affiliatesService.completeWithdrawal(id);
    }
}
