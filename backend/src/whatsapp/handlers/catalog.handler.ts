import { Injectable } from '@nestjs/common';
import { LLMService } from '../../llm/llm.service';

@Injectable()
export class CatalogHandler {
    constructor(private llmService: LLMService) { }

    async handle(
        userInput: string,
        products: any[],
        agentPersonality: string,
        provider: any
    ): Promise<string> {
        const productContext = products.map(p =>
            `- ${p.name}: ${p.price} (Stock: ${p.stock}) ${p.description ? `- ${p.description}` : ''}`
        ).join('\n');

        const prompt = `
${agentPersonality}

PRODUTOS ENCONTRADOS NO SISTEMA:
${productContext}

MENSAGEM DO CLIENTE: "${userInput}"

INSTRUÇÕES:
1. Use as informações dos produtos acima para responder à pergunta do cliente.
2. Seja extremamente natural e siga sua personalidade definida.
3. Se o cliente perguntou por algo que não está na lista, informe educadamente o que você tem de mais próximo ou peça que ele descreva melhor.
4. NUNCA diga que está consultando uma lista ou banco de dados.
5. Se o cliente insistir em algo sem stock, explique a situação de forma amigável.
`;

        return await this.llmService.generateResponse(provider, prompt, userInput);
    }
}
