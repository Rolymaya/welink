import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { OrganizationModule } from './organization/organization.module';
import { AgentModule } from './agent/agent.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './contact/contact.module';
import { AgendaModule } from './agenda/agenda.module';
import { PackagesModule } from './packages/packages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { EmailModule } from './email/email.module';
import { PlaygroundModule } from './playground/playground.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageModule } from './storage/storage.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        // Rate Limiting - Protect API from abuse
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds
            limit: 100, // 100 requests per minute per IP
        }]),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        PrismaModule,
        AuthModule,
        SuperAdminModule,
        OrganizationModule,
        AgentModule,
        KnowledgeModule,
        WhatsAppModule,
        ChatModule,
        ContactModule,
        AgendaModule,
        PackagesModule,
        SubscriptionsModule,
        EmailModule,
        PlaygroundModule,
        BankAccountsModule,
        AffiliatesModule,
        ProductsModule,
        OrdersModule,
        StorageModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
