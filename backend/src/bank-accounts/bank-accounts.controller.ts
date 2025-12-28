import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Inject, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('bank-accounts')
@ApiBearerAuth()
@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankAccountsController {
    constructor(@Inject(BankAccountsService) private readonly bankAccountsService: BankAccountsService) { }

    @Post()
    @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
    create(@Body() createBankAccountDto: CreateBankAccountDto, @Request() req) {
        // If Company Admin, force organizationId
        if (req.user.role === 'COMPANY_ADMIN') {
            createBankAccountDto.organizationId = req.user.organizationId;
        }
        return this.bankAccountsService.create(createBankAccountDto);
    }

    @Get()
    @Roles('SUPER_ADMIN')
    findAll() {
        return this.bankAccountsService.findAll();
    }

    @Get('active')
    @Roles('COMPANY_ADMIN', 'SUPER_ADMIN')
    findActive(@Request() req) {
        // If Company Admin, filter by their Org
        const orgId = req.user.role === 'COMPANY_ADMIN' ? req.user.organizationId : undefined;
        return this.bankAccountsService.findActive(orgId);
    }

    @Get('system')
    @Roles('COMPANY_ADMIN', 'SUPER_ADMIN')
    findSystem() {
        return this.bankAccountsService.findSystem();
    }

    @Get(':id')
    @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
    findOne(@Param('id') id: string) {
        return this.bankAccountsService.findOne(id);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
    update(@Param('id') id: string, @Body() updateBankAccountDto: UpdateBankAccountDto) {
        return this.bankAccountsService.update(id, updateBankAccountDto);
    }

    @Patch(':id/toggle')
    @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
    toggleActive(@Param('id') id: string) {
        return this.bankAccountsService.toggleActive(id);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
    remove(@Param('id') id: string) {
        return this.bankAccountsService.remove(id);
    }
}
