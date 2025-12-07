"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminModule = void 0;
const common_1 = require("@nestjs/common");
const super_admin_service_1 = require("./super-admin.service");
const super_admin_controller_1 = require("./super-admin.controller");
const llm_provider_service_1 = require("./llm-provider.service");
const playground_module_1 = require("../playground/playground.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
let SuperAdminModule = class SuperAdminModule {
};
exports.SuperAdminModule = SuperAdminModule;
exports.SuperAdminModule = SuperAdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => playground_module_1.PlaygroundModule),
            (0, common_1.forwardRef)(() => subscriptions_module_1.SubscriptionsModule),
        ],
        controllers: [super_admin_controller_1.SuperAdminController],
        providers: [super_admin_service_1.SuperAdminService, llm_provider_service_1.LLMProviderService],
        exports: [llm_provider_service_1.LLMProviderService],
    })
], SuperAdminModule);
//# sourceMappingURL=super-admin.module.js.map