import { Injectable, Inject } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LLMService {
    constructor(@Inject(PrismaService) private prisma: PrismaService) { }

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
        functions?: any[], // OpenAI function definitions
    ): Promise<string> {
        try {
            const openai = new OpenAI({ apiKey: provider.apiKey });
            const modelName = provider.model || provider.defaultModel || 'gpt-3.5-turbo';

            const messages: any[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ];

            const requestParams: any = {
                model: modelName,
                messages,
            };

            // Add functions if provided
            if (functions && functions.length > 0) {
                requestParams.tools = functions.map(func => ({ type: 'function', function: func }));
                requestParams.tool_choice = 'auto';
            }

            const completion = await openai.chat.completions.create(requestParams);

            const responseMessage = completion.choices[0].message;

            // Check if the model wants to call a function
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                const toolCall = responseMessage.tool_calls[0]; // Assuming one tool call for simplicity
                return JSON.stringify({
                    type: 'function_call',
                    function: toolCall.function.name,
                    arguments: JSON.parse(toolCall.function.arguments),
                });
            }

            const responseText = responseMessage.content || 'Desculpe, não consegui gerar uma resposta.';

            // Log usage
            if (provider && provider.id && typeof provider.id === 'string') {
                const usage = completion.usage;
                if (usage) {
                    await this.logUsage(
                        provider.id,
                        modelName,
                        usage.prompt_tokens,
                        usage.completion_tokens,
                        organizationId,
                        agentId
                    );
                }
            } else {
                console.warn('[LLM] Skipping usage log: Invalid provider ID');
            }

            return responseText;
        } catch (error: any) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to generate response from OpenAI: ${error.message}`);
        }
    }

    async generateResponseWithFunctions(
        provider: any,
        systemPrompt: string,
        userMessage: string,
        functions: any[],
        context?: string,
        organizationId?: string,
        agentId?: string,
    ): Promise<any> {
        const fullSystemPrompt = context
            ? `${systemPrompt}\n\nContexto relevante:\n${context}`
            : systemPrompt;

        const providerName = (provider.provider || provider.name || '').toLowerCase();

        if (providerName.includes('openai') || providerName.includes('gpt')) {
            const response = await this.callOpenAI(
                provider,
                fullSystemPrompt,
                userMessage,
                organizationId,
                agentId,
                functions
            );

            // Try to parse as function call
            try {
                const parsed = JSON.parse(response);
                if (parsed.type === 'function_call') {
                    return parsed;
                }
            } catch {
                // Not a function call, return as text
            }

            return { type: 'text', content: response };
        } else {
            // Fallback for providers without function calling
            const response = await this.generateResponse(
                provider,
                fullSystemPrompt,
                userMessage,
                context,
                organizationId,
                agentId
            );
            return { type: 'text', content: response };
        }
    }
}
