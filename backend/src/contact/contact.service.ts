import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
    constructor(@Inject(PrismaService) private prisma: PrismaService) { }

    async findAll(orgId: string) {
        return this.prisma.contact.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });
    }
    async create(orgId: string, data: any) {
        return this.prisma.contact.create({
            data: {
                ...data,
                organizationId: orgId,
            },
        });
    }
}
