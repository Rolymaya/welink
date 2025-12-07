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

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => AgentModule), // Use forwardRef to handle circular dependency
        KnowledgeModule,
        forwardRef(() => SuperAdminModule), // Use forwardRef to handle circular dependency
        LLMModule,
        AgendaModule,
        SubscriptionsModule
    ],
    controllers: [WhatsAppController],
    providers: [WhatsAppService],
    exports: [WhatsAppService], // Export for use in PlaygroundModule
})
export class WhatsAppModule { }
