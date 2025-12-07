"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const super_admin_module_1 = require("./super-admin/super-admin.module");
const organization_module_1 = require("./organization/organization.module");
const agent_module_1 = require("./agent/agent.module");
const knowledge_module_1 = require("./knowledge/knowledge.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const chat_module_1 = require("./chat/chat.module");
const contact_module_1 = require("./contact/contact.module");
const agenda_module_1 = require("./agenda/agenda.module");
const packages_module_1 = require("./packages/packages.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const email_module_1 = require("./email/email.module");
const playground_module_1 = require("./playground/playground.module");
const bank_accounts_module_1 = require("./bank-accounts/bank-accounts.module");
const schedule_1 = require("@nestjs/schedule");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            super_admin_module_1.SuperAdminModule,
            organization_module_1.OrganizationModule,
            agent_module_1.AgentModule,
            knowledge_module_1.KnowledgeModule,
            whatsapp_module_1.WhatsAppModule,
            chat_module_1.ChatModule,
            contact_module_1.ContactModule,
            agenda_module_1.AgendaModule,
            packages_module_1.PackagesModule,
            subscriptions_module_1.SubscriptionsModule,
            email_module_1.EmailModule,
            playground_module_1.PlaygroundModule,
            bank_accounts_module_1.BankAccountsModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map