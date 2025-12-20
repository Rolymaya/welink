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
import { OrderStateManager } from './order-state.manager';
import { ContextBuilderService } from './context-builder.service';
import { IntentClassifierService } from './intent-classifier.service';
import { HybridAgentService } from './hybrid-agent.service';
import { OrderHandler } from './handlers/order.handler';
import { QuestionHandler } from './handlers/question.handler';
import { ScheduleHandler } from './handlers/schedule.handler';
import { ChatHandler } from './handlers/chat.handler';

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
        // Hybrid Agent Architecture
        OrderStateManager,
        ContextBuilderService,
        IntentClassifierService,
        HybridAgentService,
        // Handlers
        OrderHandler,
        QuestionHandler,
        ScheduleHandler,
        ChatHandler,
    ],
    exports: [WhatsAppService],
})
export class WhatsAppModule { }
