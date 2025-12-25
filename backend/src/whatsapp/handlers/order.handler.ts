import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { AgentToolsService } from '../../agent/agent-tools.service';
import { LLMService } from '../../llm/llm.service';
import { OrderStateManager } from '../order-state.manager';

@Injectable()
export class OrderHandler {
    constructor(
        @Inject(forwardRef(() => AgentToolsService))
        private agentTools: AgentToolsService,
        private llmService: LLMService,
        private stateManager: OrderStateManager
    ) { }

    async handle(
        contactId: string,
        organizationId: string,
        extractedInfo: any,
        agentPersonality: string,
        provider: any,
        history: string[] = []
    ): Promise<string> {

        const state = this.stateManager.getState(contactId);

        // Update state with extracted info
        if (extractedInfo.product) {
            state.productName = extractedInfo.product;
        }
        if (extractedInfo.quantity) {
            state.quantity = extractedInfo.quantity;
        }
        if (extractedInfo.address) {
            state.address = extractedInfo.address;
        }

        // If product name but no product object, search
        if (state.productName && !state.product) {
            const products = await this.agentTools.catalogSearch(
                organizationId,
                state.productName
            );

            if (products && products.length > 0) {
                state.product = products[0];
            } else {
                return `Não encontrei "${state.productName}". Podes descrever melhor o produto?`;
            }
        }

        // Check if has all info
        if (this.stateManager.hasAllInfo(contactId)) {
            // Create order
            const result = await this.agentTools.createOrder(
                organizationId,
                contactId,
                [{ productId: state.product!.id, quantity: state.quantity! }],
                state.address!
            );

            if (result.success) {
                // Clear state ONLY on success
                this.stateManager.clearState(contactId);

                // Generate natural response - Use a short ID (8 chars) to avoid robotic UUIDs
                const shortId = result.orderId.slice(0, 8);
                return await this.generateResponse(
                    `Pedido #${shortId} criado com sucesso! Total: ${Number(result.total).toLocaleString('pt-AO')} Kz`,
                    agentPersonality,
                    provider,
                    history
                );
            } else {
                // If it failed (e.g. stock), we DO NOT clear the state so the user can fix it (e.g. change quantity)
                // We pass the raw error message to generateResponse
                return await this.generateResponse(
                    result.message,
                    agentPersonality,
                    provider,
                    history
                );
            }
        }

        // Ask for missing info
        const missing = this.stateManager.getMissingInfo(contactId);
        return await this.askForMissingInfo(missing, state, agentPersonality, provider);
    }

    private async askForMissingInfo(
        missing: string[],
        state: any,
        agentPersonality: string,
        provider: any
    ): Promise<string> {
        const prompt = `
${agentPersonality}

Estado atual:
- Produto: ${state.product?.name || 'não definido'}
- Quantidade: ${state.quantity || 'não definida'}
- Endereço: ${state.address || 'não definido'}

Falta: ${missing.join(', ')}

INSTRUÇÕES:
1. Use o contexto acima para pedir a informação que falta.
2. Siga rigorosamente a personalidade definida no seu prompt principal.
3. Seja natural e evite parecer um robô.
`;

        return await this.llmService.generateResponse(provider, prompt, '');
    }

    private async generateResponse(
        result: string,
        agentPersonality: string,
        provider: any,
        history: string[] = []
    ): Promise<string> {
        const prompt = `
${agentPersonality}

Informação do Sistema (para seu conhecimento): ${result}

HISTÓRICO RECENTE DA CONVERSA:
${history.join('\n')}

INSTRUÇÕES PARA SUA RESPOSTA:
1. Você deve agir de acordo com a personalidade definida no seu prompt acima.
2. Transmita a informação do sistema de forma natural e integrada na sua conversa. Use o histórico para manter o contexto.
3. Se houver um número de pedido (ex: #3090afa0), use apenas os primeiros 8 caracteres se necessário, ou apenas confirme que o pedido foi feito. NUNCA mostre IDs longos de 36 caracteres.
4. Se houver um problema de stock (ex: "Insufficient stock"), seja proativo e informe o cliente sobre a quantidade disponível, perguntando se deseja prosseguir com o que há em stock.
5. NUNCA use termos técnicos ("BadRequest", "ERRO", "String", "id" literal).
6. NUNCA mencione que recebeu uma "Informação do Sistema".
`;

        return await this.llmService.generateResponse(provider, prompt, '');
    }
}
