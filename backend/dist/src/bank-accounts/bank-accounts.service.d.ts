import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
export declare class BankAccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createBankAccountDto: CreateBankAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string;
        accountHolder: string;
        iban: string;
        swift: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string;
        accountHolder: string;
        iban: string;
        swift: string | null;
    }[]>;
    findActive(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string;
        accountHolder: string;
        iban: string;
        swift: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string;
        accountHolder: string;
        iban: string;
        swift: string | null;
    }>;
    update(id: string, updateBankAccountDto: UpdateBankAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string;
        accountHolder: string;
        iban: string;
        swift: string | null;
    }>;
    toggleActive(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string;
        accountHolder: string;
        iban: string;
        swift: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        bankName: string;
        accountHolder: string;
        iban: string;
        swift: string | null;
    }>;
}
