"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LLMProviderService = class LLMProviderService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveProvider(preferredProvider) {
        var _a;
        const whereClause = { isActive: true };
        if (preferredProvider) {
            whereClause.name = preferredProvider;
        }
        let provider = await this.prisma.lLMProvider.findFirst({
            where: whereClause,
            orderBy: { priority: 'desc' },
        });
        if (!provider && preferredProvider) {
            provider = await this.prisma.lLMProvider.findFirst({
                where: { isActive: true },
                orderBy: { priority: 'desc' },
            });
        }
        if (!provider) {
            console.warn('[LLM] No active LLM providers found');
            return null;
        }
        return {
            provider: provider.name,
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            model: provider.defaultModel || ((_a = provider.models) === null || _a === void 0 ? void 0 : _a.split(',')[0]) || provider.models,
            models: provider.models,
            defaultModel: provider.defaultModel,
        };
    }
};
exports.LLMProviderService = LLMProviderService;
exports.LLMProviderService = LLMProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LLMProviderService);
//# sourceMappingURL=llm-provider.service.js.map