import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private productsService: ProductsService,
    ) { }

    async create(organizationId: string, dto: CreateOrderDto) {
        // Validate stock availability for all items
        for (const item of dto.items) {
            const availability = await this.productsService.checkAvailability(
                item.productId,
                item.quantity
            );

            if (!availability.available) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                });
                throw new BadRequestException(
                    `Product "${product?.name}" is not available: ${availability.reason}`
                );
            }
        }

        // Calculate total and prepare order items
        let totalAmount = 0;
        const orderItems = [];

        for (const item of dto.items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                throw new BadRequestException(`Product ${item.productId} not found`);
            }

            totalAmount += Number(product.price) * item.quantity;
            orderItems.push({
                productId: item.productId,
                quantity: item.quantity,
                priceAtTime: product.price,
                productNameSnapshot: product.name,
            });
        }

        // Create order with items
        const order = await this.prisma.order.create({
            data: {
                organizationId,
                contactId: dto.contactId,
                deliveryAddress: dto.deliveryAddress,
                totalAmount,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                contact: true,
            },
        });

        // Decrease stock for physical products
        for (const item of dto.items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (product?.isPhysical && product.stock !== null) {
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: product.stock - item.quantity,
                    },
                });
            }
        }

        return order;
    }

    async findAll(organizationId: string, status?: string) {
        return this.prisma.order.findMany({
            where: {
                organizationId,
                ...(status ? { status: status as any } : {}),
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                contact: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string, organizationId: string) {
        return this.prisma.order.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                contact: true,
            },
        });
    }

    async updateStatus(id: string, organizationId: string, dto: UpdateOrderStatusDto) {
        return this.prisma.order.update({
            where: {
                id,
                organizationId,
            },
            data: {
                status: dto.status,
                rejectionReason: dto.rejectionReason,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                contact: true,
            },
        });
    }

    // AI Agent Tool: Get order status for a contact
    async getContactOrders(contactId: string) {
        return this.prisma.order.findMany({
            where: {
                contactId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5, // Last 5 orders
        });
    }
}
