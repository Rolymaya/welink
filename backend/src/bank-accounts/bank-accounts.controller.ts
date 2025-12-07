import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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
    constructor(private readonly bankAccountsService: BankAccountsService) { }

    @Post()
    @Roles('SUPER_ADMIN')
    create(@Body() createBankAccountDto: CreateBankAccountDto) {
        return this.bankAccountsService.create(createBankAccountDto);
    }

    @Get()
    @Roles('SUPER_ADMIN')
    findAll() {
        return this.bankAccountsService.findAll();
    }

    @Get('active')
    @Roles('COMPANY_ADMIN', 'SUPER_ADMIN')
    findActive() {
        return this.bankAccountsService.findActive();
    }

    @Get(':id')
    @Roles('SUPER_ADMIN')
    findOne(@Param('id') id: string) {
        return this.bankAccountsService.findOne(id);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN')
    update(@Param('id') id: string, @Body() updateBankAccountDto: UpdateBankAccountDto) {
        return this.bankAccountsService.update(id, updateBankAccountDto);
    }

    @Patch(':id/toggle')
    @Roles('SUPER_ADMIN')
    toggleActive(@Param('id') id: string) {
        return this.bankAccountsService.toggleActive(id);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN')
    remove(@Param('id') id: string) {
        return this.bankAccountsService.remove(id);
    }
}
