import { Injectable } from '@nestjs/common';
import { OrderStateManager } from './order-state.manager';
import { ContextBuilderService } from './context-builder.service';
import { IntentClassifierService } from './intent-classifier.service';
import { OrderHandler } from './handlers/order.handler';
import { QuestionHandler } from './handlers/question.handler';
import { ScheduleHandler } from './handlers/schedule.handler';
import { ChatHandler } from './handlers/chat.handler';
import { VectorStoreService } from '../knowledge/vector-store.service';
import { LLMProviderService } from '../super-admin/llm-provider.service';
import { AgentToolsService } from '../agent/agent-tools.service';
import { IngestionService } from '../knowledge/ingestion.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HybridAgentService {
    constructor(
        private stateManager: OrderStateManager,
        private contextBuilder: ContextBuilderService,
        private intentClassifier: IntentClassifierService,
        private orderHandler: OrderHandler,
        private questionHandler: QuestionHandler,
        private scheduleHandler: ScheduleHandler,
        private chatHandler: ChatHandler,
        private vectorStore: VectorStoreService,
        private llmProviderService: LLMProviderService,

        private agentTools: AgentToolsService,
        private ingestionService: IngestionService
    ) { }

    async processMessage(
        userInput: string,
        contactId: string,
        organizationId: string,
        agentPersonality: string
    ): Promise<string> {

        console.log('[HybridAgent] Processing message for contact:', contactId);

        // Get LLM provider
        const provider = await this.llmProviderService.getActiveProvider();
        if (!provider) {
            throw new Error('No active LLM provider');
        }

        // ═══════════════════════════════════════════════════════
        // STEP 1: BUILD CONTEXT
        // ═══════════════════════════════════════════════════════

        const currentState = this.stateManager.getState(contactId);
        const context = await this.contextBuilder.buildContext(
            userInput,
            contactId,
            organizationId,
            currentState
        );

        console.log('[HybridAgent] Context built:', {
            hasState: !!context.state,
            recentHistoryCount: context.recentHistory.length,
            hasRelevantHistory: !!context.relevantHistory,
            knowledgeCount: context.knowledgeContext.length
        });

        // ═══════════════════════════════════════════════════════
        // STEP 2: CLASSIFY INTENT (ReAct)
        // ═══════════════════════════════════════════════════════

        const decision = await this.intentClassifier.classifyIntent(
            userInput,
            context,
            agentPersonality,
            provider
        );

        console.log('[HybridAgent] Intent classified:', decision.intent);
        console.log('[HybridAgent] Reasoning:', decision.reasoning);

        // ═══════════════════════════════════════════════════════
        // STEP 3: EXECUTE HANDLER (Conditional Chains)
        // ═══════════════════════════════════════════════════════

        let response: string;

        switch (decision.intent) {
            case 'BROWSE_CATALOG':
                // List available products
                const products = await this.agentTools.catalogSearch(
                    organizationId,
                    '', // empty query = all products
                    undefined
                );

                if (products && products.length > 0) {
                    const productList = products.map(p => `${p.name} - ${p.price}`).join('\n');
                    response = `Temos os seguintes produtos:\n${productList}\n\nQual te interessa?`;
                } else {
                    response = 'Ainda não temos produtos disponíveis.';
                }
                break;

            case 'ORDER':
                response = await this.orderHandler.handle(
                    contactId,
                    organizationId,
                    decision.extractedInfo,
                    agentPersonality,
                    provider
                );
                break;

            case 'SCHEDULE':
                response = await this.scheduleHandler.handle(
                    userInput,
                    contactId,
                    organizationId,
                    agentPersonality,
                    provider,
                    context.recentHistory
                );
                break;

            case 'QUESTION':
                response = await this.questionHandler.handle(
                    userInput,
                    context.knowledgeContext,
                    agentPersonality,
                    provider,
                    organizationId
                );
                break;

            case 'CHAT':
                response = await this.chatHandler.handle(
                    userInput,
                    agentPersonality,
                    provider
                );
                break;

            default:
                response = await this.chatHandler.handle(
                    userInput,
                    agentPersonality,
                    provider
                );
        }

        // ═══════════════════════════════════════════════════════
        // STEP 4: SAVE TO VECTOR STORE (with contactId!)
        // ═══════════════════════════════════════════════════════

        await this.saveToVectorStore(
            userInput,
            response,
            contactId,
            organizationId
        );

        console.log('[HybridAgent] Response generated and saved');

        return response;
    }

    private async saveToVectorStore(
        userInput: string,
        response: string,
        contactId: string,
        organizationId: string
    ): Promise<void> {
        try {
            const content = `User: ${userInput}\nAssistant: ${response}`;

            // Generate embedding using ingestion service
            const embedding = await this.ingestionService.embedQuery(content);
            const vectorId = uuidv4();

            // Store in Weaviate
            await this.vectorStore.addVectors([{
                id: vectorId,
                vector: embedding,
                properties: {
                    content,
                    contactId,        // ← CRITICAL: Privacy
                    organizationId,
                    timestamp: new Date().toISOString(), // Weaviate likes ISO strings
                    type: 'chat_message',
                    kbId: 'chat-history' // Mark as chat history to distinguish from KB
                }
            }]);

            console.log('[HybridAgent] Chat history saved to vector store');

        } catch (error) {
            console.error('[HybridAgent] Failed to save to vector store:', error);
            // Don't throw - saving to vector store is not critical for response
        }
    }
}
