import { PrismaService } from '../prisma/prisma.service';
import { CreateLLMProviderDto } from './dto/create-llm-provider.dto';
import { UpdateLLMProviderDto } from './dto/update-llm-provider.dto';
import { PlaygroundService } from '../playground/playground.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
export declare class SuperAdminService {
    private prisma;
    private playgroundService;
    private subscriptionsService;
    constructor(prisma: PrismaService, playgroundService: PlaygroundService, subscriptionsService: SubscriptionsService);
    createProvider(data: CreateLLMProviderDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: number;
        apiKey: string;
        baseUrl: string | null;
        models: string;
        defaultModel: string | null;
    }>;
    findAllProviders(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: number;
        apiKey: string;
        baseUrl: string | null;
        models: string;
        defaultModel: string | null;
    }[]>;
    updateProvider(id: string, data: UpdateLLMProviderDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: number;
        apiKey: string;
        baseUrl: string | null;
        models: string;
        defaultModel: string | null;
    }>;
    deleteProvider(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        priority: number;
        apiKey: string;
        baseUrl: string | null;
        models: string;
        defaultModel: string | null;
    }>;
    getGlobalStats(): Promise<{
        overview: {
            totalOrganizations: number;
            activeSubscriptions: number;
            totalAgents: number;
            totalSessions: number;
            totalRevenue: number;
            pendingPurchases: number;
        };
        charts: {
            monthlyRevenue: {
                month: string;
                amount: number;
            }[];
            messagesByOrganization: {
                name: string;
                count: number;
            }[];
        };
    }>;
    getSettings(): Promise<{}>;
    updateSettings(settings: Record<string, string>): Promise<{}>;
}
