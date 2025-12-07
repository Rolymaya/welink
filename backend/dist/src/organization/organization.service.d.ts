import { PrismaService } from '../prisma/prisma.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
export declare class OrganizationService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: RegisterOrganizationDto, logoFile?: Express.Multer.File): Promise<{
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
    }>;
    findAll(): Promise<({
        _count: {
            agents: number;
        };
        agents: {
            _count: {
                sessions: number;
            };
        }[];
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        users: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        }[];
    } & {
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
    }>;
    update(id: string, dto: UpdateOrganizationDto): Promise<{
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
    }>;
    uploadLogo(id: string, file: Express.Multer.File): Promise<{
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
    }>;
    getDashboardStats(orgId: string): Promise<{
        agents: {
            total: number;
            active: number;
            paused: number;
        };
        messages: {
            today: number;
        };
        sessions: {
            total: number;
            connected: number;
        };
        upcomingAppointments: number;
        recentActivity: {
            id: string;
            contactName: string;
            contactPhone: string;
            content: string;
            createdAt: Date;
        }[];
    }>;
    completeOnboarding(id: string): Promise<{
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
    }>;
}
