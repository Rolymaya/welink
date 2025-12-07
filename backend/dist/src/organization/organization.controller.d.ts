import { OrganizationService } from './organization.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthService } from '../auth/auth.service';
export declare class OrganizationController {
    private readonly organizationService;
    private readonly authService;
    constructor(organizationService: OrganizationService, authService: AuthService);
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
    register(req: any, dto: RegisterOrganizationDto, logo: Express.Multer.File): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            organizationId: any;
        };
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
    }>;
    getProfile(req: any): Promise<({
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
    }) | {
        message: string;
    }>;
    updateProfile(req: any, dto: UpdateOrganizationDto): Promise<{
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
    uploadLogo(req: any, file: Express.Multer.File): Promise<{
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
    getDashboardStats(req: any): Promise<{
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
    completeOnboarding(req: any): Promise<{
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
