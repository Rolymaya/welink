import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LLMService {
    constructor(private prisma: PrismaService) { }

    async generateResponse(
        provider: any, // LLMProvider from Prisma
        systemPrompt: string,
        userMessage: string,
        context?: string,
        organizationId?: string,
        agentId?: string,
    ): Promise<string> {
        // Use provider.provider instead of provider.name
        const providerName = (provider.provider || provider.name || '').toLowerCase();

        // Build full prompt with context if available
        const fullSystemPrompt = context
            ? `${systemPrompt}\n\nContexto relevante:\n${context}`
            : systemPrompt;

        if (providerName.includes('gemini') || providerName.includes('google')) {
            return this.callGemini(provider, fullSystemPrompt, userMessage, organizationId, agentId);
        } else if (providerName.includes('openai') || providerName.includes('gpt') || providerName.includes('chatgpt')) {
            return this.callOpenAI(provider, fullSystemPrompt, userMessage, organizationId, agentId);
        } else {
            throw new Error(`Unsupported LLM provider: ${providerName}`);
        }
    }

    private async logUsage(
        providerId: string,
        model: string,
        tokensInput: number,
        tokensOutput: number,
        organizationId?: string,
        agentId?: string,
    ) {
        try {
            // Simple cost estimation (can be refined later)
            // Avg cost per 1k tokens: $0.0015 (Input), $0.002 (Output)
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
        } catch (error) {
            console.error('[LLM] Failed to log usage:', error);
        }
    }

    private async callGemini(
        provider: any,
        systemPrompt: string,
        userMessage: string,
        organizationId?: string,
        agentId?: string,
    ): Promise<string> {
        try {
            const genAI = new GoogleGenerativeAI(provider.apiKey);
            const modelName = provider.defaultModel || provider.models.split(',')[0] || 'gemini-pro';
            const gemini = genAI.getGenerativeModel({ model: modelName });

            const result = await gemini.generateContent([
                `${systemPrompt}\n\nUser: ${userMessage}`,
            ]);

            const responseText = result.response.text();

            // Estimate tokens for Gemini (approx 4 chars per token)
            const inputTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);
            const outputTokens = Math.ceil(responseText.length / 4);

            await this.logUsage(provider.id, modelName, inputTokens, outputTokens, organizationId, agentId);

            return responseText;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error('Failed to generate response from Gemini');
        }
    }

    private async callOpenAI(
        provider: any,
        systemPrompt: string,
        userMessage: string,
        organizationId?: string,
        agentId?: string,
    ): Promise<string> {
        try {
            // Safe model extraction
            let model = 'gpt-3.5-turbo'; // default
            if (provider.model) {
                model = provider.model;
            } else if (provider.models) {
                model = typeof provider.models === 'string'
                    ? provider.models.split(',')[0]
                    : provider.models[0];
            } else if (provider.defaultModel) {
                model = provider.defaultModel;
            }

            console.log('[LLM] Calling OpenAI with config:', {
                model,
                hasApiKey: !!provider.apiKey,
                baseUrl: provider.baseUrl || 'default',
            });

            const config: any = { apiKey: provider.apiKey };
            if (provider.baseUrl) {
                config.baseURL = provider.baseUrl;
            }

            const openai = new OpenAI(config);

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
                await this.logUsage(
                    provider.id,
                    model,
                    usage.prompt_tokens,
                    usage.completion_tokens,
                    organizationId,
                    agentId
                );
            }

            return completion.choices[0].message.content || 'No response generated';
        } catch (error: any) {
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
}
