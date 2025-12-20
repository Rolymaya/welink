import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, UseInterceptors, UploadedFile, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApproveSubscriptionDto } from './dto/approve-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { join, extname } from 'path';
import * as fs from 'fs';
import { Express } from 'express';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
    constructor(@Inject(SubscriptionsService) private readonly subscriptionsService: SubscriptionsService) { }

    @Post()
    @Roles('COMPANY_ADMIN')
    @UseInterceptors(FileInterceptor('proof'))
    async create(
        @Request() req,
        @Body() createSubscriptionDto: CreateSubscriptionDto,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (file) {
            const uploadDir = join(process.cwd(), 'uploads', 'proofs');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extname(file.originalname)}`;
            const filepath = join(uploadDir, filename);

            fs.writeFileSync(filepath, file.buffer);
            createSubscriptionDto.paymentProofUrl = `/uploads/proofs/${filename}`;
        }

        return this.subscriptionsService.create(req.user.organizationId, createSubscriptionDto);
    }

    @Get()
    @Roles('SUPER_ADMIN')
    findAll() {
        return this.subscriptionsService.findAll();
    }

    @Get('my')
    @Roles('COMPANY_ADMIN')
    findMy(@Request() req) {
        return this.subscriptionsService.findByOrganization(req.user.organizationId);
    }

    @Get('status')
    @Roles('COMPANY_ADMIN')
    async getStatus(@Request() req) {
        const subscription = await this.subscriptionsService.getActiveSubscription(req.user.organizationId);
        return {
            hasActiveSubscription: !!subscription,
            subscription: subscription || null,
        };
    }

    @Get('active')
    @Roles('COMPANY_ADMIN')
    getActive(@Request() req) {
        return this.subscriptionsService.getActiveSubscription(req.user.organizationId);
    }

    @Get('usage')
    @Roles('COMPANY_ADMIN')
    getUsage(@Request() req) {
        return this.subscriptionsService.getUsage(req.user.organizationId);
    }

    @Get('settings')
    @Roles('COMPANY_ADMIN')
    getSettings() {
        return this.subscriptionsService.getSettings();
    }

    @Patch(':id/approve')
    @Roles('SUPER_ADMIN')
    approve(@Param('id') id: string, @Body() approveDto: ApproveSubscriptionDto) {
        return this.subscriptionsService.approve(id, approveDto);
    }
}
