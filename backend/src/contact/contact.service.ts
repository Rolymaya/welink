import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
    constructor(@Inject(PrismaService) private prisma: PrismaService) { }

    async findAll(orgId: string) {
        // Fetch from ContactDirectory (Base de Contactos) instead of Contact
        // This enforces subscription limits on the contacts page
        const directoryContacts = await this.prisma.contactDirectory.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
        });

        // Get message counts from Contact table for each directory contact
        const contactsWithCounts = await Promise.all(
            directoryContacts.map(async (dirContact) => {
                const contact = await this.prisma.contact.findFirst({
                    where: {
                        phone: dirContact.phone,
                        organizationId: orgId,
                    },
                    include: {
                        _count: {
                            select: { messages: true }
                        }
                    }
                });

                return {
                    id: dirContact.id,
                    phone: dirContact.phone,
                    name: dirContact.name,
                    tags: dirContact.tags,
                    createdAt: dirContact.createdAt,
                    _count: {
                        messages: contact?._count?.messages || 0
                    }
                };
            })
        );

        return contactsWithCounts;
    }

    async create(orgId: string, data: any) {
        // When manually creating a contact, add to both tables
        const contact = await this.prisma.contact.create({
            data: {
                ...data,
                organizationId: orgId,
            },
        });

        // Also add to directory
        await this.prisma.contactDirectory.create({
            data: {
                phone: data.phone,
                name: data.name,
                organizationId: orgId,
                tags: data.tags || '',
            },
        });

        return contact;
    }
}
