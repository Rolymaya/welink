import { Module, forwardRef } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentToolsService } from './agent-tools.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LLMModule } from '../llm/llm.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { AgendaModule } from '../agenda/agenda.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';

@Module({
    imports: [
        SubscriptionsModule,
        LLMModule,
        ProductsModule,
        OrdersModule,
        BankAccountsModule,
        AgendaModule,
        AffiliatesModule,
        forwardRef(() => SuperAdminModule), // Use forwardRef to handle circular dependency
    ],
    controllers: [AgentController],
    providers: [AgentService, AgentToolsService],
    exports: [AgentService, AgentToolsService],
})
export class AgentModule { }
