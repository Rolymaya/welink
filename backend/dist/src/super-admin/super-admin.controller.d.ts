import { SuperAdminService } from './super-admin.service';
import { CreateLLMProviderDto } from './dto/create-llm-provider.dto';
import { UpdateLLMProviderDto } from './dto/update-llm-provider.dto';
export declare class SuperAdminController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    create(createDto: CreateLLMProviderDto): Promise<{
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
    findAll(): Promise<{
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
    update(id: string, updateDto: UpdateLLMProviderDto): Promise<{
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
    remove(id: string): Promise<{
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
    getStats(): Promise<{
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
