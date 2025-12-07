import { Module, forwardRef } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { PrismaService } from '../prisma/prisma.service';
import { VectorStoreService } from './vector-store.service';
import { IngestionService } from './ingestion.service';
import { SuperAdminModule } from '../super-admin/super-admin.module';

@Module({
    imports: [
        forwardRef(() => SuperAdminModule),
    ],
    controllers: [KnowledgeController],
    providers: [
        KnowledgeService,
        PrismaService,
        VectorStoreService,
        IngestionService
    ],
    exports: [KnowledgeService, VectorStoreService, IngestionService],
})
export class KnowledgeModule { }
