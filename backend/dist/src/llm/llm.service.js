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
exports.LLMService = void 0;
const common_1 = require("@nestjs/common");
const generative_ai_1 = require("@google/generative-ai");
const openai_1 = require("openai");
const prisma_service_1 = require("../prisma/prisma.service");
let LLMService = class LLMService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateResponse(provider, systemPrompt, userMessage, context, organizationId, agentId) {
        const providerName = (provider.provider || provider.name || '').toLowerCase();
        const fullSystemPrompt = context
            ? `${systemPrompt}\n\nContexto relevante:\n${context}`
            : systemPrompt;
        if (providerName.includes('gemini') || providerName.includes('google')) {
            return this.callGemini(provider, fullSystemPrompt, userMessage, organizationId, agentId);
        }
        else if (providerName.includes('openai') || providerName.includes('gpt') || providerName.includes('chatgpt')) {
            return this.callOpenAI(provider, fullSystemPrompt, userMessage, organizationId, agentId);
        }
        else {
            throw new Error(`Unsupported LLM provider: ${providerName}`);
        }
    }
    async logUsage(providerId, model, tokensInput, tokensOutput, organizationId, agentId) {
        try {
            const cost = (tokensInput * 0.0000015) + (tokensOutput * 0.000002);
            await this.prisma.lLMUsageLog.create({
                data: {
                    providerId,
                    model,
                    tokensInput,
                    tokensOutput,
                    cost,
                    organizationId,
                    agentId,
                },
            });
            console.log(`[LLM] Usage logged: ${tokensInput} in, ${tokensOutput} out, $${cost.toFixed(6)}`);
        }
        catch (error) {
            console.error('[LLM] Failed to log usage:', error);
        }
    }
    async callGemini(provider, systemPrompt, userMessage, organizationId, agentId) {
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(provider.apiKey);
            const modelName = provider.defaultModel || provider.models.split(',')[0] || 'gemini-pro';
            const gemini = genAI.getGenerativeModel({ model: modelName });
            const result = await gemini.generateContent([
                `${systemPrompt}\n\nUser: ${userMessage}`,
            ]);
            const responseText = result.response.text();
            const inputTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);
            const outputTokens = Math.ceil(responseText.length / 4);
            await this.logUsage(provider.id, modelName, inputTokens, outputTokens, organizationId, agentId);
            return responseText;
        }
        catch (error) {
            console.error('Gemini API error:', error);
            throw new Error('Failed to generate response from Gemini');
        }
    }
    async callOpenAI(provider, systemPrompt, userMessage, organizationId, agentId) {
        try {
            let model = 'gpt-3.5-turbo';
            if (provider.model) {
                model = provider.model;
            }
            else if (provider.models) {
                model = typeof provider.models === 'string'
                    ? provider.models.split(',')[0]
                    : provider.models[0];
            }
            else if (provider.defaultModel) {
                model = provider.defaultModel;
            }
            console.log('[LLM] Calling OpenAI with config:', {
                model,
                hasApiKey: !!provider.apiKey,
                baseUrl: provider.baseUrl || 'default',
            });
            const config = { apiKey: provider.apiKey };
            if (provider.baseUrl) {
                config.baseURL = provider.baseUrl;
            }
            const openai = new openai_1.default(config);
            console.log('[LLM] Sending request to OpenAI, model:', model);
            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
            });
            console.log('[LLM] OpenAI response received successfully');
            const usage = completion.usage;
            if (usage) {
                await this.logUsage(provider.id, model, usage.prompt_tokens, usage.completion_tokens, organizationId, agentId);
            }
            return completion.choices[0].message.content || 'No response generated';
        }
        catch (error) {
            console.error('[LLM] OpenAI API error details:', {
                message: error.message,
                status: error.status,
                type: error.type,
                code: error.code,
                fullError: JSON.stringify(error, null, 2),
            });
            throw new Error(`Failed to generate response from OpenAI: ${error.message}`);
        }
    }
};
exports.LLMService = LLMService;
exports.LLMService = LLMService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LLMService);
//# sourceMappingURL=llm.service.js.map