import { Injectable } from '@nestjs/common';
import { LLMService } from '../../llm/llm.service';

@Injectable()
export class ChatHandler {
    constructor(private llmService: LLMService) { }

    async handle(
        userInput: string,
        agentPersonality: string,
        provider: any
    ): Promise<string> {

        const prompt = `
${agentPersonality}

O cliente disse: "${userInput}"

Responda de forma amigável e natural, mantendo sua personalidade.
Seja breve e direto.
`;

        return await this.llmService.generateResponse(provider, prompt, userInput);
    }
}
