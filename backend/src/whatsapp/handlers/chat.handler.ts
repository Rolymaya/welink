import { Injectable } from '@nestjs/common';
import { LLMService } from '../../llm/llm.service';

@Injectable()
export class ChatHandler {
    constructor(private llmService: LLMService) { }

    async handle(
        userInput: string,
        agentPersonality: string,
        provider: any,
        history: string[] = [],
        systemInfo: string | null = null
    ): Promise<string> {

        const prompt = `
${agentPersonality}

HISTÓRICO RECENTE DA CONVERSA:
${history.join('\n')}

${systemInfo ? `INFORMAÇÕES ADICIONAIS DO SISTEMA:\n${systemInfo}` : ''}

MENSAGEM DO CLIENTE: "${userInput}"

INSTRUÇÕES:
1. Responda de forma amigável e natural, mantendo sua personalidade.
2. Seja breve e direto.
3. Use o histórico acima para manter o contexto — se o cliente se referir a algo dito antes, você deve saber do que ele fala.
4. Se houver "Informações Adicionais do Sistema" (como histórico de pedidos), use-as para responder com precisão.
`;

        return await this.llmService.generateResponse(provider, prompt, userInput);
    }
}
