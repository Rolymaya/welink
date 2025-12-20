import { Injectable } from '@nestjs/common';
import { AgentToolsService } from '../../agent/agent-tools.service';
import { LLMService } from '../../llm/llm.service';
import { OrderStateManager } from '../order-state.manager';

@Injectable()
export class OrderHandler {
    constructor(
        private agentTools: AgentToolsService,
        private llmService: LLMService,
        private stateManager: OrderStateManager
    ) { }

    async handle(
        contactId: string,
        organizationId: string,
        extractedInfo: any,
        agentPersonality: string,
        provider: any
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
            const order = await this.agentTools.createOrder(
                organizationId,
                contactId,
                [{ productId: state.product!.id, quantity: state.quantity! }],
                state.address!
            );

            // Clear state
            this.stateManager.clearState(contactId);

            // Generate natural response
            return await this.generateResponse(
                `Pedido ${order.orderId} criado com sucesso! Total: ${order.total}kz`,
                agentPersonality,
                provider
            );
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

Gere uma pergunta natural em português para pedir a informação que falta.
Seja direto e amigável.
`;

        return await this.llmService.generateResponse(provider, prompt, '');
    }

    private async generateResponse(
        result: string,
        agentPersonality: string,
        provider: any
    ): Promise<string> {
        const prompt = `
${agentPersonality}

Resultado: ${result}

Gere uma resposta natural e amigável em português.
Não mencione IDs técnicos.
`;

        return await this.llmService.generateResponse(provider, prompt, '');
    }
}
