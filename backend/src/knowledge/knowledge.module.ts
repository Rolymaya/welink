import { Module, forwardRef } from '@nestjs/common';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { PrismaService } from '../prisma/prisma.service';
import { VectorStoreService } from './vector-store.service';
import { IngestionService } from './ingestion.service';
import { LLMModule } from '../llm/llm.module';

@Module({
    imports: [
        forwardRef(() => SuperAdminModule),
        LLMModule,
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
