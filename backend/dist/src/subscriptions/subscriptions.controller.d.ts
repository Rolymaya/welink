import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApproveSubscriptionDto } from './dto/approve-subscription.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(req: any, createSubscriptionDto: CreateSubscriptionDto, file: Express.Multer.File): Promise<{
        organization: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            maxAgents: number;
            maxSessions: number;
            maxContacts: number;
            isActive: boolean;
            slug: string;
            logo: string | null;
            sector: string | null;
            businessHours: import("@prisma/client/runtime/library").JsonValue | null;
            privacyPolicy: string | null;
            termsOfService: string | null;
            returnPolicy: string | null;
            onboarded: boolean;
            plan: string;
        };
        package: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxAgents: number;
            maxSessions: number;
            maxContacts: number;
            allowAudioResponse: boolean;
            allowScheduling: boolean;
            isActive: boolean;
        };
        bankAccount: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            bankName: string;
            accountHolder: string;
            iban: string;
            swift: string | null;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        packageId: string;
        bankAccountId: string | null;
        paymentProofUrl: string | null;
        startDate: Date;
        endDate: Date;
    }>;
    findAll(): Promise<({
        organization: {
            id: string;
            name: string;
        };
        package: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxAgents: number;
            maxSessions: number;
            maxContacts: number;
            allowAudioResponse: boolean;
            allowScheduling: boolean;
            isActive: boolean;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        packageId: string;
        bankAccountId: string | null;
        paymentProofUrl: string | null;
        startDate: Date;
        endDate: Date;
    })[]>;
    findMy(req: any): Promise<({
        package: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxAgents: number;
            maxSessions: number;
            maxContacts: number;
            allowAudioResponse: boolean;
            allowScheduling: boolean;
            isActive: boolean;
        };
        transactions: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            status: import(".prisma/client").$Enums.TransactionStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            subscriptionId: string;
        }[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        packageId: string;
        bankAccountId: string | null;
        paymentProofUrl: string | null;
        startDate: Date;
        endDate: Date;
    })[]>;
    getStatus(req: any): Promise<{
        hasActiveSubscription: boolean;
        subscription: {
            organization: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                maxAgents: number;
                maxSessions: number;
                maxContacts: number;
                isActive: boolean;
                slug: string;
                logo: string | null;
                sector: string | null;
                businessHours: import("@prisma/client/runtime/library").JsonValue | null;
                privacyPolicy: string | null;
                termsOfService: string | null;
                returnPolicy: string | null;
                onboarded: boolean;
                plan: string;
            };
            package: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string;
                price: import("@prisma/client/runtime/library").Decimal;
                durationDays: number;
                maxAgents: number;
                maxSessions: number;
                maxContacts: number;
                allowAudioResponse: boolean;
                allowScheduling: boolean;
                isActive: boolean;
            };
        } & {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            packageId: string;
            bankAccountId: string | null;
            paymentProofUrl: string | null;
            startDate: Date;
            endDate: Date;
        };
    }>;
    getActive(req: any): Promise<{
        organization: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            maxAgents: number;
            maxSessions: number;
            maxContacts: number;
            isActive: boolean;
            slug: string;
            logo: string | null;
            sector: string | null;
            businessHours: import("@prisma/client/runtime/library").JsonValue | null;
            privacyPolicy: string | null;
            termsOfService: string | null;
            returnPolicy: string | null;
            onboarded: boolean;
            plan: string;
        };
        package: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            maxAgents: number;
            maxSessions: number;
            maxContacts: number;
            allowAudioResponse: boolean;
            allowScheduling: boolean;
            isActive: boolean;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        packageId: string;
        bankAccountId: string | null;
        paymentProofUrl: string | null;
        startDate: Date;
        endDate: Date;
    }>;
    getUsage(req: any): Promise<{
        agents: number;
        sessions: number;
        contacts: number;
    }>;
    getSettings(): Promise<{}>;
    approve(id: string, approveDto: ApproveSubscriptionDto): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        packageId: string;
        bankAccountId: string | null;
        paymentProofUrl: string | null;
        startDate: Date;
        endDate: Date;
    }>;
}
