import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Inject } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CreateLLMProviderDto } from './dto/create-llm-provider.dto';
import { UpdateLLMProviderDto } from './dto/update-llm-provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('super-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin')
export class SuperAdminController {
    constructor(@Inject(SuperAdminService) private readonly superAdminService: SuperAdminService) { }

    @Post('providers')
    create(@Body() createDto: CreateLLMProviderDto) {
        return this.superAdminService.createProvider(createDto);
    }

    @Get('providers')
    findAll() {
        return this.superAdminService.findAllProviders();
    }

    @Patch('providers/:id')
    update(@Param('id') id: string, @Body() updateDto: UpdateLLMProviderDto) {
        return this.superAdminService.updateProvider(id, updateDto);
    }

    @Delete('providers/:id')
    remove(@Param('id') id: string) {
        return this.superAdminService.deleteProvider(id);
    }

    @Get('stats')
    getStats() {
        return this.superAdminService.getGlobalStats();
    }

    @Get('settings')
    getSettings() {
        return this.superAdminService.getSettings();
    }

    @Post('settings')
    updateSettings(@Body() settings: Record<string, string>) {
        return this.superAdminService.updateSettings(settings);
    }
}
