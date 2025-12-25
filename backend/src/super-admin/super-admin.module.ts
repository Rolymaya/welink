import { Module, forwardRef } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { LLMProviderService } from './llm-provider.service';
import { PlaygroundModule } from '../playground/playground.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LLMModule } from '../llm/llm.module';

@Module({
    imports: [
        forwardRef(() => PlaygroundModule),
        forwardRef(() => SubscriptionsModule),
        LLMModule,
    ],
    controllers: [SuperAdminController],
    providers: [SuperAdminService, LLMProviderService],
    exports: [LLMProviderService],
})
export class SuperAdminModule { }
