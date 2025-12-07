export declare class CreateLLMProviderDto {
    name: string;
    apiKey: string;
    baseUrl?: string;
    models: string;
    defaultModel?: string;
    isActive?: boolean;
    priority?: number;
}
