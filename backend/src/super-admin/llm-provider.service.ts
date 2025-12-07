import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LLMProviderService {
    constructor(private prisma: PrismaService) { }

    async getActiveProvider(preferredProvider?: string) {
        // Logic:
        // 1. If preferredProvider is active, use it.
        // 2. Else, find the highest priority active provider.
        // 3. Return credentials (decrypted if needed).

        const whereClause: any = { isActive: true };
        if (preferredProvider) {
            whereClause.name = preferredProvider;
        }

        let provider = await this.prisma.lLMProvider.findFirst({
            where: whereClause,
            orderBy: { priority: 'desc' },
        });

        if (!provider && preferredProvider) {
            // Fallback: try any active provider if preferred is not found/active
            provider = await this.prisma.lLMProvider.findFirst({
                where: { isActive: true },
                orderBy: { priority: 'desc' },
            });
        }

        if (!provider) {
            console.warn('[LLM] No active LLM providers found');
            return null;
        }

        return {
            provider: provider.name,
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            model: provider.defaultModel || provider.models?.split(',')[0] || provider.models,
            models: provider.models, // Keep original for reference
            defaultModel: provider.defaultModel,
        };
    }
}
