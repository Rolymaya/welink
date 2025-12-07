import { Module, forwardRef } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LLMModule } from '../llm/llm.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';

@Module({
    imports: [
        SubscriptionsModule,
        LLMModule,
        forwardRef(() => SuperAdminModule), // Use forwardRef to handle circular dependency
    ],
    controllers: [AgentController],
    providers: [AgentService],
    exports: [AgentService],
})
export class AgentModule { }
