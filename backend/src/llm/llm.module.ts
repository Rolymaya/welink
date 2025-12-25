import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { OpenAIIntegrationService } from './openai-integration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [LLMService, OpenAIIntegrationService],
    exports: [LLMService, OpenAIIntegrationService],
})
export class LLMModule { }
