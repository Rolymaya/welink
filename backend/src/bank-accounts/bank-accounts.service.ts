import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
    constructor(private prisma: PrismaService) { }

    async create(createBankAccountDto: CreateBankAccountDto) {
        return this.prisma.bankAccount.create({
            data: createBankAccountDto,
        });
    }

    async findAll() {
        return this.prisma.bankAccount.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActive() {
        return this.prisma.bankAccount.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const bankAccount = await this.prisma.bankAccount.findUnique({
            where: { id },
        });

        if (!bankAccount) {
            throw new NotFoundException('Bank account not found');
        }

        return bankAccount;
    }

    async update(id: string, updateBankAccountDto: UpdateBankAccountDto) {
        await this.findOne(id); // Check if exists

        return this.prisma.bankAccount.update({
            where: { id },
            data: updateBankAccountDto,
        });
    }

    async toggleActive(id: string) {
        const bankAccount = await this.findOne(id);

        return this.prisma.bankAccount.update({
            where: { id },
            data: { isActive: !bankAccount.isActive },
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Check if exists

        return this.prisma.bankAccount.delete({
            where: { id },
        });
    }
}
