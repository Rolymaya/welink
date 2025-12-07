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
exports.PackagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PackagesService = class PackagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
    async findOne(id) {
        return this.prisma.package.findUnique({
            where: { id },
        });
    }
    async update(id, dto) {
        try {
            const updateData = Object.assign({}, dto);
            if (dto.price !== undefined)
                updateData.price = Number(dto.price);
            if (dto.durationDays !== undefined)
                updateData.durationDays = Number(dto.durationDays);
            if (dto.maxAgents !== undefined)
                updateData.maxAgents = Number(dto.maxAgents);
            if (dto.maxSessions !== undefined)
                updateData.maxSessions = Number(dto.maxSessions);
            if (dto.maxContacts !== undefined)
                updateData.maxContacts = Number(dto.maxContacts);
            return this.prisma.package.update({
                where: { id },
                data: updateData,
            });
        }
        catch (error) {
            console.error('Error updating package:', error);
            throw error;
        }
    }
    async remove(id) {
        return this.prisma.package.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PackagesService);
//# sourceMappingURL=packages.service.js.map