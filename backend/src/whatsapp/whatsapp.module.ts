import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentModule } from '../agent/agent.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { LLMModule } from '../llm/llm.module';
import { AgendaModule } from '../agenda/agenda.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ProductsModule } from '../products/products.module';
import { HybridAgentService } from './hybrid-agent.service';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => AgentModule),
        forwardRef(() => KnowledgeModule),
        forwardRef(() => SuperAdminModule),
        forwardRef(() => LLMModule),
        forwardRef(() => AgendaModule),
        SubscriptionsModule,
        ProductsModule,
    ],
    controllers: [WhatsAppController],
    providers: [
        WhatsAppService,
        // Hybrid Agent Architecture (OpenAI Next-Gen)
        HybridAgentService,
    ],
    exports: [WhatsAppService],
})
export class WhatsAppModule { }
