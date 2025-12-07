import { PrismaService } from '../prisma/prisma.service';
export declare class ContactService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(orgId: string): Promise<({
        _count: {
            messages: number;
        };
    } & {
        id: string;
        name: string | null;
        phone: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
    })[]>;
    create(orgId: string, data: any): Promise<{
        id: string;
        name: string | null;
        phone: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        tags: string;
    }>;
}
