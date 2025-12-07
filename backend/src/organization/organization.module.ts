import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [
        AuthModule,
        MulterModule.register({
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    ],
    controllers: [OrganizationController],
    providers: [OrganizationService, PrismaService],
    exports: [OrganizationService],
})
export class OrganizationModule { }
