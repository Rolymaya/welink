import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { VectorStoreService } from '../knowledge/vector-store.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';
import { AgentToolsService } from '../agent/agent-tools.service';
import { IngestionService } from '../knowledge/ingestion.service';
import { OpenAIIntegrationService } from '../llm/openai-integration.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HybridAgentService {
    private readonly logger = new Logger(HybridAgentService.name);

    constructor(
        @Inject(forwardRef(() => AgentToolsService))
        private agentTools: AgentToolsService,
        private ingestionService: IngestionService,
        private vectorStore: VectorStoreService,
        private llmProviderService: LLMProviderService,
        private openaiIntegration: OpenAIIntegrationService,
    ) { }

    async processMessage(
        userInput: string,
        contactId: string,
        organizationId: string,
        agentId: string,
    ): Promise<string> {
        this.logger.log(`[HybridAgent] Processing message with OpenAI Next-Gen for contact: ${contactId}`);

        // 1. Obter as definições de ferramentas
        const tools = this.agentTools.getFunctionDefinitions().map(f => ({
            type: 'function',
            function: f
        }));

        // 2. Iniciar a execução na OpenAI
        let { run, threadId } = await this.openaiIntegration.generateResponse(
            contactId,
            agentId,
            userInput,
            tools as any
        );

        // 3. Loop de processamento de Tool Calls (se necessário)
        const openai: any = await (this.openaiIntegration as any).getClient();
        let finalMessage = '';

        while (run.status === 'requires_action') {
            const toolCalls = run.required_action?.submit_tool_outputs.tool_calls || [];
            const toolOutputs = [];

            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                this.logger.log(`[HybridAgent] OpenAI solicitou ferramenta: ${functionName}`);

                let output: any;

                try {
                    switch (functionName) {
                        case 'catalog_search':
                            output = await this.agentTools.catalogSearch(organizationId, args.query, args.category);
                            break;
                        case 'check_availability':
                            output = await this.agentTools.checkAvailability(args.productId, args.quantity);
                            break;
                        case 'create_order':
                            output = await this.agentTools.createOrder(organizationId, contactId, args.items, args.deliveryAddress);
                            break;
                        case 'get_order_status':
                            output = await this.agentTools.getOrderStatus(contactId);
                            break;
                        case 'get_bank_accounts':
                            output = await this.agentTools.getBankAccounts(organizationId);
                            break;
                        case 'schedule_follow_up':
                            output = await this.agentTools.scheduleFollowUp(organizationId, contactId, args.query);
                            break;
                        case 'create_schedule':
                            output = await this.agentTools.createSchedule(organizationId, contactId, args.subject, args.date, args.summary);
                            break;
                        case 'send_response':
                            output = await this.agentTools.sendResponse(args.text);
                            finalMessage = args.text; // Captura a mensagem final
                            break;
                        default:
                            output = { error: 'Ferramenta não encontrada' };
                    }
                } catch (e) {
                    this.logger.error(`Erro ao executar ferramenta ${functionName}:`, e.message);
                    output = { error: e.message };
                }

                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(output)
                });
            }

            // Submeter os resultados de volta à OpenAI
            run = await openai.beta.threads.runs.submitToolOutputsAndPoll(threadId, run.id, {
                tool_outputs: toolOutputs
            });
        }

        // 4. Obter a resposta final
        if (run.status === 'completed') {
            // Se o LLM usou a ferramenta send_response, usamos o texto capturado.
            // Caso contrário, tentamos pegar o conteúdo da última mensagem (fallback).
            let response = finalMessage;
            if (!response) {
                this.logger.warn('[HybridAgent] LLM não usou a ferramenta send_response. Pegando resposta direta.');
                response = await this.openaiIntegration.getRunResult(threadId, run.id);
            }

            // Salvar no Vector Store local (Audit)
            await this.saveToVectorStore(userInput, response, contactId, organizationId);

            return response;
        } else {
            this.logger.error(`Run falhou com status: ${run.status}`);
            return 'Desculpe, tive um problema ao processar a sua solicitação. Por favor, tente novamente.';
        }
    }

    private async saveToVectorStore(
        userInput: string,
        response: string,
        contactId: string,
        organizationId: string
    ): Promise<void> {
        try {
            const content = `User: ${userInput}\nAssistant: ${response}`;
            const embedding = await this.ingestionService.embedQuery(content);
            const vectorId = uuidv4();

            await this.vectorStore.addVectors([{
                id: vectorId,
                vector: embedding,
                properties: {
                    content,
                    contactId,
                    organizationId,
                    timestamp: new Date().toISOString(),
                    type: 'chat_message',
                    kbId: 'chat-history'
                }
            }]);
        } catch (error) {
            this.logger.error('[HybridAgent] Failed to save to vector store:', error);
        }
    }
}
