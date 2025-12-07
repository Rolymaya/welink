import { Controller, Post, Body, Get, Patch, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';

@ApiTags('organization')
@ApiBearerAuth()
@Controller('organization')
export class OrganizationController {
    constructor(
        private readonly organizationService: OrganizationService,
        private readonly authService: AuthService
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async findAll() {
        return this.organizationService.findAll();
    }

    @Post('register')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('logo'))
    @ApiConsumes('multipart/form-data')
    async register(@Request() req, @Body() dto: RegisterOrganizationDto, @UploadedFile() logo: Express.Multer.File) {
        const organization = await this.organizationService.create(req.user.userId, dto, logo);

        // Login user to get new token with updated role and organizationId
        const updatedUser = {
            id: req.user.userId,
            email: req.user.email,
            role: 'COMPANY_ADMIN',
            organizationId: organization.id
        };
        const token = await this.authService.login(updatedUser);

        return {
            organization,
            ...token
        };
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        if (!req.user.orgId) {
            return { message: 'User does not belong to an organization' };
        }
        return this.organizationService.findOne(req.user.orgId);
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Request() req, @Body() dto: UpdateOrganizationDto) {
        return this.organizationService.update(req.user.orgId, dto);
    }

    @Post('logo')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadLogo(@Request() req, @UploadedFile() file: Express.Multer.File) {
        return this.organizationService.uploadLogo(req.user.orgId, file);
    }

    @Get('dashboard-stats')
    @UseGuards(JwtAuthGuard)
    async getDashboardStats(@Request() req) {
        return this.organizationService.getDashboardStats(req.user.orgId);
    }

    @Patch('complete-onboarding')
    @UseGuards(JwtAuthGuard)
    async completeOnboarding(@Request() req) {
        return this.organizationService.completeOnboarding(req.user.orgId);
    }
}
