import { Injectable } from '@nestjs/common';
import { LLMService } from '../../llm/llm.service';

import { KnowledgeService } from '../../knowledge/knowledge.service';

@Injectable()
export class QuestionHandler {
    constructor(
        private llmService: LLMService,
        private knowledgeService: KnowledgeService
    ) { }

    async handle(
        userInput: string,
        knowledgeContext: any[], // Might be empty now
        agentPersonality: string,
        provider: any,
        organizationId: string // Need orgId for search
    ): Promise<string> {

        // If no context provided (optimization), fetch it now
        if (!knowledgeContext || knowledgeContext.length === 0) {
            console.log('[QuestionHandler] No context provided, fetching on-demand...');
            console.log(`[QuestionHandler] Searching for: "${userInput}" in Org: ${organizationId}`);

            try {
                const results = await this.knowledgeService.search(userInput, organizationId, 3);
                console.log('[QuestionHandler] RAW Search Results:', JSON.stringify(results, null, 2));

                knowledgeContext = results;
                console.log('[QuestionHandler] Fetched items count:', knowledgeContext.length);
            } catch (error) {
                console.error('[QuestionHandler] Search CRASHED:', error);
            }
        } else {
            console.log('[QuestionHandler] Context was already provided (Size: ' + knowledgeContext.length + ')');
        }

        if (!knowledgeContext || knowledgeContext.length === 0) {
            return "Não tenho informação sobre isso no momento. Posso ajudar com outra coisa?";
        }

        // Format knowledge - handle both {content} and direct string formats
        const knowledgeText = knowledgeContext
            .map(k => typeof k === 'string' ? k : k.content)
            .filter(Boolean)
            .join('\n\n');

        if (!knowledgeText) {
            return "Não tenho informação sobre isso no momento. Posso ajudar com outra coisa?";
        }

        console.log('[QuestionHandler] Using knowledge:', knowledgeText.substring(0, 200) + '...');

        const prompt = `
${agentPersonality}

CONHECIMENTO DISPONÍVEL:
${knowledgeText}

PERGUNTA DO CLIENTE:
"${userInput}"

Responda à pergunta usando o conhecimento disponível.
Seja natural e útil.
Se o conhecimento não responder completamente, diga o que sabe e ofereça ajuda adicional.
`;

        console.log('[QuestionHandler] Generating response with Valid Knowledge...');
        // console.log('[QuestionHandler] FULL PROMPT:', prompt); // Uncomment if needed

        const response = await this.llmService.generateResponse(provider, prompt, userInput);
        console.log('[QuestionHandler] Generated Response:', response);
        return response;
    }
}
