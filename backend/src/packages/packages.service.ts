import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreatePackageDto) {
        return this.prisma.package.create({
            data: dto,
        });
    }

    async findAll() {
        return this.prisma.package.findMany({
            orderBy: { price: 'asc' },
        });
    }

    async findActive() {
        return this.prisma.package.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.package.findUnique({
            where: { id },
        });
    }

    async update(id: string, dto: UpdatePackageDto) {
        try {
            const updateData: any = { ...dto };

            // Convert numeric fields to proper types
            if (dto.price !== undefined) updateData.price = Number(dto.price);
            if (dto.durationDays !== undefined) updateData.durationDays = Number(dto.durationDays);
            if (dto.maxAgents !== undefined) updateData.maxAgents = Number(dto.maxAgents);
            if (dto.maxSessions !== undefined) updateData.maxSessions = Number(dto.maxSessions);
            if (dto.maxContacts !== undefined) updateData.maxContacts = Number(dto.maxContacts);

            return this.prisma.package.update({
                where: { id },
                data: updateData,
            });
        } catch (error) {
            console.error('Error updating package:', error);
            throw error;
        }
    }

    async remove(id: string) {
        // Soft delete
        return this.prisma.package.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
