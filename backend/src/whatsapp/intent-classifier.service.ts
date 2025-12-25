import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { ConversationContext } from './context-builder.service';

export type Intent = 'ORDER' | 'BROWSE_CATALOG' | 'SCHEDULE' | 'QUESTION' | 'CHAT' | 'HISTORY';

export interface IntentDecision {
    intent: Intent;
    reasoning: string;
    extractedInfo: {
        product: string | null;
        quantity: number | null;
        address: string | null;
    };
}

@Injectable()
export class IntentClassifierService {
    constructor(private llmService: LLMService) { }

    async classifyIntent(
        userInput: string,
        context: ConversationContext,
        agentPersonality: string,
        provider: any
    ): Promise<IntentDecision> {

        const prompt = `
${agentPersonality}

ESTADO DA CONVERSA:
${JSON.stringify(context.state, null, 2)}

HISTÓRICO RECENTE:
${context.recentHistory.join('\n')}

${context.relevantHistory ? `CONTEXTO DO PASSADO:\n${context.relevantHistory}` : ''}

MENSAGEM DO CLIENTE:
"${userInput}"

FUNÇÕES DO SISTEMA DISPONÍVEIS (Sua missão é decidir qual executar):

1. BROWSE_CATALOG
   - O que faz: Listar produtos físicos ou buscar informações de vendas de itens tangíveis (preços, stock de produtos).
   - Quando usar: Quando o cliente pergunta "o que vocês têm?", "quais os preços?", "tem o produto X?".
   - **IMPORTANTE**: Use apenas para PRODUTOS (coisas que se vendem em unidades). Se for sobre serviços da empresa, utilize QUESTION.

2. ORDER
   - O que faz: Iniciar ou prosseguir com um pedido de compra.
   - Quando usar: Quando o cliente quiser fechar uma compra ou especificar quantidades.

3. QUESTION
   - O que faz: Buscar respostas sobre SERVIÇOS, REGRAS, PROMOÇÕES ou informações institucionais.
   - Quando usar: Quando o cliente pergunta "quais os vossos serviços?", "como funciona o site?", "quem são vocês?", ou segue uma conversa sobre serviços mencionados anteriormente.

4. HISTORY
   - O que faz: Consultar o passado do próprio cliente.
   - Quando usar: Quando o cliente pergunta "o que pedi ontem?", "qual o estado do meu pedido?", "o que eu já comprei?".

5. SCHEDULE
   - O que faz: Marcar reuniões.

6. CHAT
   - O que faz: Conversa casual, saudações.

INSTRUCÃO: Interprete a mensagem e decida o intent. Se o cliente falar "Para um site" logo após perguntar por "serviços", ele provavelmente está a perguntar sobre o SERVIÇO de site (intent QUESTION).

Responda APENAS com JSON:
{
  "intent": "ORDER | BROWSE_CATALOG | SCHEDULE | QUESTION | CHAT | HISTORY",
  "reasoning": "...",
  "extractedInfo": { ... }
}
`;

        const response = await this.llmService.generateResponse(
            provider,
            prompt,
            userInput
        );

        try {
            // More robust cleaning: find the first { and last }
            const firstOpen = response.indexOf('{');
            const lastClose = response.lastIndexOf('}');

            if (firstOpen === -1 || lastClose === -1) {
                throw new Error('No JSON object found in response');
            }

            const cleanedResponse = response.substring(firstOpen, lastClose + 1);
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('[IntentClassifier] Failed to parse response:', response);
            console.error('[IntentClassifier] Error details:', error.message);
            // Fallback
            return {
                intent: 'CHAT',
                reasoning: 'Failed to parse intent',
                extractedInfo: {
                    product: null,
                    quantity: null,
                    address: null
                }
            };
        }
    }
}
