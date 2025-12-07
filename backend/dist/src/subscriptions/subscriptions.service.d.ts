import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApproveSubscriptionDto } from './dto/approve-subscription.dto';
import { EmailService } from '../email/email.service';
export declare class SubscriptionsService implements OnModuleInit {
    private prisma;
    private schedulerRegistry;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, schedulerRegistry: SchedulerRegistry, emailService: EmailService);
    onModuleInit(): Promise<void>;
    private getSuperAdminEmail;
    private sendPurchaseNotification;
    create(organizationId: string, dto: CreateSubscriptionDto): Promise<{
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
    findByOrganization(organizationId: string): Promise<({
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
    getActiveSubscription(organizationId: string): Promise<{
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
    approve(id: string, dto: ApproveSubscriptionDto): Promise<{
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
    getUsage(organizationId: string): Promise<{
        agents: number;
        sessions: number;
        contacts: number;
    }>;
    getSettings(): Promise<{}>;
    setupExpirationJob(): Promise<void>;
    expireSubscriptions(): Promise<{
        expired: number;
    }>;
}
