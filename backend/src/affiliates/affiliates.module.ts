import { Module } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { AdminAffiliatesController } from './admin-affiliates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AffiliatesController, AdminAffiliatesController],
    providers: [AffiliatesService],
    exports: [AffiliatesService],
})
export class AffiliatesModule { }
