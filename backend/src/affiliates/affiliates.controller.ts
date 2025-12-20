import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    UseGuards,
    Request,
    Inject,
    Delete,
    Param,
} from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Controller('affiliates')
@UseGuards(JwtAuthGuard)
export class AffiliatesController {
    constructor(@Inject(AffiliatesService) private readonly affiliatesService: AffiliatesService) { }

    /**
     * GET /affiliates/stats
     * Obtém estatísticas do afiliado (empresa logada)
     */
    @Get('stats')
    async getStats(@Request() req) {
        const organizationId = req.user.organizationId;
        return this.affiliatesService.getStats(organizationId);
    }

    /**
     * GET /affiliates/bank-accounts
     * Lista contas bancárias do afiliado
     */
    @Get('bank-accounts')
    async getBankAccounts(@Request() req) {
        const organizationId = req.user.organizationId;
        return this.affiliatesService.getBankAccounts(organizationId);
    }

    /**
     * POST /affiliates/bank-account
     * Adiciona dados bancários do afiliado
     */
    @Post('bank-account')
    async addBankAccount(
        @Request() req,
        @Body() dto: UpdateBankAccountDto,
    ) {
        const organizationId = req.user.organizationId;
        return this.affiliatesService.addBankAccount(organizationId, dto);
    }

    /**
     * DELETE /affiliates/bank-account/:id
     * Remove dados bancários do afiliado
     */
    @Delete('bank-account/:id')
    async removeBankAccount(
        @Request() req,
        @Param('id') id: string,
    ) {
        const organizationId = req.user.organizationId;
        return this.affiliatesService.removeBankAccount(organizationId, id);
    }

    /**
     * POST /affiliates/withdraw
     * Solicita um saque
     */
    @Post('withdraw')
    async requestWithdrawal(
        @Request() req,
        @Body() body: { amount: number; bankAccountId: string; password?: string },
    ) {
        const organizationId = req.user.organizationId;
        const userId = req.user.id;
        return this.affiliatesService.requestWithdrawal(
            organizationId,
            userId,
            body.amount,
            body.bankAccountId,
            body.password,
        );
    }
}
