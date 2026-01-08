import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

import { IngestionService } from '../knowledge/ingestion.service';
import { VectorStoreService } from '../knowledge/vector-store.service';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private ingestionService: IngestionService,
        private vectorStoreService: VectorStoreService,
    ) { }

    async create(organizationId: string, dto: CreateProductDto) {
        const product = await this.prisma.product.create({
            data: {
                ...dto,
                organizationId,
            },
        });

        // Async indexing
        this.ingestionService.indexProduct(product, organizationId);
        return product;
    }

    async findAll(organizationId: string, includeInactive = false) {
        return this.prisma.product.findMany({
            where: {
                organizationId,
                ...(includeInactive ? {} : { isActive: true }),
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string, organizationId: string) {
        return this.prisma.product.findFirst({
            where: {
                id,
                organizationId,
            },
        });
    }

    async update(id: string, organizationId: string, dto: UpdateProductDto) {
        const product = await this.prisma.product.update({
            where: {
                id,
                organizationId,
            },
            data: dto,
        });

        // Async indexing
        this.ingestionService.indexProduct(product, organizationId);
        return product;
    }

    async delete(id: string, organizationId: string) {
        // Remove from Vector Store
        this.vectorStoreService.deleteObjectById(id).catch(e => console.error(e));

        // Soft delete by setting isActive to false
        return this.prisma.product.update({
            where: {
                id,
                organizationId,
            },
            data: {
                isActive: false,
            },
        });
    }

    // AI Agent Tool: Search products by name/description/category
    async searchProducts(organizationId: string, query: string, category?: string) {
        return this.prisma.product.findMany({
            where: {
                organizationId,
                isActive: true,
                OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                    { category: { contains: query } },
                    ...(category ? [{ category: { contains: category } }] : []),
                ],
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                category: true,
                isPhysical: true,
                stock: true,
            },
        });
    }

    // AI Agent Tool: Check if product is available
    async checkAvailability(productId: string, quantity: number) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || !product.isActive) {
            return { available: false, reason: 'Product not found or inactive' };
        }

        if (!product.isPhysical) {
            return {
                available: true,
                reason: 'Digital product',
                price: product.price,
                total: Number(product.price) * quantity
            };
        }

        if (!product.stock || product.stock < quantity) {
            return {
                available: false,
                reason: 'Insufficient stock',
                currentStock: product.stock || 0
            };
        }

        return {
            available: true,
            reason: 'In stock',
            price: product.price,
            total: Number(product.price) * quantity
        };
    }
}
