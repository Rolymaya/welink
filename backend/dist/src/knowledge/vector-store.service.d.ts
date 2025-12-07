import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class VectorStoreService implements OnModuleInit {
    private configService;
    private client;
    private readonly logger;
    private readonly CLASS_NAME;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureSchema;
    addVectors(vectors: {
        id: string;
        vector: number[];
        properties: any;
    }[]): Promise<({
        class?: string;
        vectorWeights?: {
            [key: string]: unknown;
        };
        properties?: {
            [key: string]: unknown;
        };
        id?: string;
        creationTimeUnix?: number;
        lastUpdateTimeUnix?: number;
        vector?: number[];
        vectors?: {
            [key: string]: number[];
        };
        tenant?: string;
        additional?: {
            [key: string]: {
                [key: string]: unknown;
            };
        };
    } & {
        deprecations?: {
            id?: string;
            status?: string;
            apiType?: string;
            msg?: string;
            mitigation?: string;
            sinceVersion?: string;
            plannedRemovalVersion?: string;
            removedIn?: string;
            removedTime?: string;
            sinceTime?: string;
            locations?: string[];
        }[];
    } & {
        result?: {
            status?: "SUCCESS" | "PENDING" | "FAILED";
            errors?: {
                error?: {
                    message?: string;
                }[];
            };
        };
    })[]>;
    search(queryVector: number[], orgId: string, limit?: number): Promise<{
        data: any;
    }>;
    deleteByKbId(kbId: string): Promise<{
        match?: {
            class?: string;
            where?: {
                operands?: any[];
                operator?: "And" | "Or" | "Equal" | "Like" | "NotEqual" | "GreaterThan" | "GreaterThanEqual" | "LessThan" | "LessThanEqual" | "WithinGeoRange" | "IsNull" | "ContainsAny" | "ContainsAll";
                path?: string[];
                valueInt?: number;
                valueNumber?: number;
                valueBoolean?: boolean;
                valueString?: string;
                valueText?: string;
                valueDate?: string;
                valueIntArray?: number[];
                valueNumberArray?: number[];
                valueBooleanArray?: boolean[];
                valueStringArray?: string[];
                valueTextArray?: string[];
                valueDateArray?: string[];
                valueGeoRange?: {
                    geoCoordinates?: {
                        latitude?: number;
                        longitude?: number;
                    };
                    distance?: {
                        max?: number;
                    };
                };
            };
        };
        output?: string;
        dryRun?: boolean;
        results?: {
            matches?: number;
            limit?: number;
            successful?: number;
            failed?: number;
            objects?: {
                id?: string;
                status?: "SUCCESS" | "DRYRUN" | "FAILED";
                errors?: {
                    error?: {
                        message?: string;
                    }[];
                };
            }[];
        };
    }>;
    private readonly MESSAGE_CLASS_NAME;
    ensureMessageSchema(): Promise<void>;
    addMessageVector(vector: {
        id: string;
        vector: number[];
        properties: any;
    }): Promise<{
        class?: string;
        vectorWeights?: {
            [key: string]: unknown;
        };
        properties?: {
            [key: string]: unknown;
        };
        id?: string;
        creationTimeUnix?: number;
        lastUpdateTimeUnix?: number;
        vector?: number[];
        vectors?: {
            [key: string]: number[];
        };
        tenant?: string;
        additional?: {
            [key: string]: {
                [key: string]: unknown;
            };
        };
    }>;
    searchMessages(queryVector: number[], sessionId: string, limit?: number): Promise<{
        data: any;
    }>;
}
