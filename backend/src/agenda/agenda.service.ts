import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgendaService {
    constructor(@Inject(PrismaService) private prisma: PrismaService) { }

    async create(data: {
        subject: string;
        client?: string;
        date: Date;
        summary?: string;
        organizationId: string;
        contactId?: string;
    }) {
        return this.prisma.agenda.create({
            data,
        });
    }

    async findAll(organizationId: string) {
        return this.prisma.agenda.findMany({
            where: { organizationId },
            orderBy: { date: 'asc' },
            include: {
                contact: true,
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.agenda.findUnique({
            where: { id },
            include: {
                contact: true,
            },
        });
    }

    async update(id: string, data: any) {
        return this.prisma.agenda.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.agenda.delete({
            where: { id },
        });
    }
}
