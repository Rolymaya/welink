"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankAccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BankAccountsService = class BankAccountsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBankAccountDto) {
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
    async findOne(id) {
        const bankAccount = await this.prisma.bankAccount.findUnique({
            where: { id },
        });
        if (!bankAccount) {
            throw new common_1.NotFoundException('Bank account not found');
        }
        return bankAccount;
    }
    async update(id, updateBankAccountDto) {
        await this.findOne(id);
        return this.prisma.bankAccount.update({
            where: { id },
            data: updateBankAccountDto,
        });
    }
    async toggleActive(id) {
        const bankAccount = await this.findOne(id);
        return this.prisma.bankAccount.update({
            where: { id },
            data: { isActive: !bankAccount.isActive },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.bankAccount.delete({
            where: { id },
        });
    }
};
exports.BankAccountsService = BankAccountsService;
exports.BankAccountsService = BankAccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BankAccountsService);
//# sourceMappingURL=bank-accounts.service.js.map