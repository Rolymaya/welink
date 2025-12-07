import { PrismaService } from '../prisma/prisma.service';
export declare class AgendaService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        subject: string;
        client?: string;
        date: Date;
        summary?: string;
        organizationId: string;
        contactId?: string;
    }): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
    findAll(organizationId: string): Promise<({
        contact: {
            id: string;
            name: string | null;
            phone: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    })[]>;
    findOne(id: string): Promise<{
        contact: {
            id: string;
            name: string | null;
            phone: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            tags: string;
        };
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        date: Date;
        summary: string | null;
        contactId: string | null;
        client: string | null;
    }>;
}
