import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { ConversationContext } from './context-builder.service';

export type Intent = 'ORDER' | 'BROWSE_CATALOG' | 'SCHEDULE' | 'QUESTION' | 'CHAT';

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
   - O que faz: Buscar produtos disponíveis (preço, stock).
   - Quando usar: Sempre que houver interesse explícito ou implícito em produtos, marcas, modelos, disponibilidade ou catálogo — mesmo sem pergunta direta.

2. ORDER
   - O que faz: Iniciar processo de venda (criar pedido).
   - Quando usar: Quando o cliente quiser comprar ou fechar negócio.

3. QUESTION
   - O que faz: Buscar respostas da base de conhecimento (PDFs, Docs da Empresa).
   - Quando usar: Quando for necessário responder com INFORMAÇÃO CONCRETA, consultar bases de dados de textos, ou perguntas sobre REGRAS, PROMOÇÕES, CAMPANHAS e SERVIÇOS.

4. SCHEDULE
   - O que faz: Iniciar agendamento.
   - Quando usar: Quando o cliente quiser marcar reunião ou compromisso.

5. CHAT
   - O que faz: Apenas responder.
   - Quando usar: Somente para saudações ou mensagens sem ação técnica.

INSTRUCÃO: Interprete a mensagem do cliente e decida qual destas funções atende melhor a necessidade dele.

Responda APENAS com JSON válido:
{
  "intent": "ORDER | BROWSE_CATALOG | SCHEDULE | QUESTION | CHAT",
  "reasoning": "breve explicação da sua análise",
  "extractedInfo": {
    "product": "nome do produto mencionado ou null",
    "quantity": número ou null,
    "address": "endereço mencionado ou null"
  }
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
