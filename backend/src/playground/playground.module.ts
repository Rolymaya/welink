import { Module } from '@nestjs/common';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PlaygroundWhatsAppService } from './playground-whatsapp.service';
import { LLMModule } from '../llm/llm.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        LLMModule,
    ],
    controllers: [PlaygroundController],
    providers: [PlaygroundService, PrismaService, PlaygroundWhatsAppService],
    exports: [PlaygroundService],
})
export class PlaygroundModule { }
