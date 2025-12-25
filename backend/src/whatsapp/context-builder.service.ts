import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VectorStoreService } from '../knowledge/vector-store.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { OrderState } from './order-state.manager';

export interface ConversationContext {
    state: OrderState;
    recentHistory: string[];
    relevantHistory: string | null;
    knowledgeContext: any[];
}

@Injectable()
export class ContextBuilderService {
    constructor(
        private prisma: PrismaService,
        private vectorStore: VectorStoreService,
        private knowledgeService: KnowledgeService
    ) { }

    async buildContext(
        userInput: string,
        contactId: string,
        organizationId: string,
        currentState: OrderState
    ): Promise<ConversationContext> {

        // 1. Recent history from Postgres (last 5 messages)
        const recentMessages = await this.prisma.message.findMany({
            where: { contactId },
            orderBy: { createdAt: 'desc' },
            take: 12,
            select: {
                role: true,
                content: true
            }
        });

        const recentHistory = recentMessages
            .reverse()
            .map(m => `${m.role}: ${m.content}`);

        // 2. Check if needs old context (RAG)
        let relevantHistory: string | null = null;
        if (this.needsOldContext(userInput)) {
            const results = await this.vectorStore.searchByText(userInput, {
                contactId,
                type: 'chat_message'
            });

            if (results && results.length > 0) {
                relevantHistory = results.map((r: any) => r.content).join('\n');
            }
        }

        // 3. Knowledge base context - REMOVED for optimization
        // We now fetch this ONLY in QuestionHandler if needed
        let knowledgeResults = [];
        /*
        try {
            const kbResults = await this.knowledgeService.search(userInput, organizationId, 3);
            knowledgeResults = kbResults;
        } catch (error) {
            console.log('[ContextBuilder] Knowledge base search failed:', error.message);
        }
        */

        return {
            state: currentState,
            recentHistory,
            relevantHistory,
            knowledgeContext: knowledgeResults
        };
    }

    private needsOldContext(input: string): boolean {
        const triggers = /disse|falei|mencionei|antes|ontem|semana passada|qual era|como era|lembras|recordas|habitual|costuma/i;
        return triggers.test(input);
    }
}
