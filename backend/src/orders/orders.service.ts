import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { ProductsService } from '../products/products.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { AffiliatesService } from '../affiliates/affiliates.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private productsService: ProductsService,
        private bankAccountsService: BankAccountsService,
        private affiliatesService: AffiliatesService,
        @Inject(forwardRef(() => WhatsAppService))
        private whatsappService: WhatsAppService,
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

                let errorMsg = `Product "${product?.name}" is not available: ${availability.reason}`;
                if (availability.reason === 'Insufficient stock' && (availability as any).currentStock !== undefined) {
                    errorMsg += `. Current stock: ${(availability as any).currentStock}`;
                }

                throw new BadRequestException(errorMsg);
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
        console.log(`[OrdersService] Updating status for Order ID: ${id}, Org ID: ${organizationId}, Status: ${dto.status}`);

        // Manual validation to ensure rejection reason is provided when rejecting
        if (dto.status === 'REJECTED' && !dto.rejectionReason) {
            throw new BadRequestException('Motivo da rejeição é obrigatório ao rejeitar um pedido');
        }

        try {
            const updatedOrder = await this.prisma.order.update({
                where: {
                    id,
                    organizationId,
                },
                data: {
                    status: dto.status,
                    // Only save rejection reason if status is REJECTED, otherwise clear it (null)
                    rejectionReason: dto.status === 'REJECTED' ? dto.rejectionReason : null,
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

            // AUTOMATION: If order is approved (AWAITING_PAYMENT), send WhatsApp notification with bank details
            if (dto.status === 'AWAITING_PAYMENT' && updatedOrder.contact?.phone) {
                console.log(`[OrdersService] Order approved. Triggering automated notification for ${updatedOrder.contact.phone}`);

                try {
                    let bankAccounts = await this.bankAccountsService.findActive(organizationId);

                    // FALLBACK: If no standard bank accounts found, look into Affiliate bank accounts
                    if (bankAccounts.length === 0) {
                        const affiliateAccounts = await this.affiliatesService.getBankAccounts(organizationId);
                        if (affiliateAccounts.length > 0) {
                            bankAccounts = affiliateAccounts as any; // Map to same structure for message builder
                        }
                    }

                    let bankMessage = '';
                    if (bankAccounts.length > 0) {
                        bankMessage = '\n\nDADOS PARA PAGAMENTO:\n' + bankAccounts.map(acc =>
                            `🏦 ${acc.bankName || 'Banco'}\nTitular: ${acc.accountHolder}\nIBAN: ${acc.iban}`
                        ).join('\n\n');
                    } else {
                        bankMessage = '\n\nPor favor, entre em contacto para dados de pagamento.';
                    }

                    const message = `Olá ${updatedOrder.contact.name || ''}! 👋\n\n` +
                        `O seu pedido *#${updatedOrder.id.slice(0, 8)}* foi aprovado com sucesso! ✅\n\n` +
                        `*Total:* ${Number(updatedOrder.totalAmount).toLocaleString('pt-AO')} Kz\n` +
                        `*Endereço:* ${updatedOrder.deliveryAddress}` +
                        bankMessage +
                        `\n\nApós o pagamento, por favor envie o comprovante por aqui. Obrigado!`;

                    await this.whatsappService.sendNotification(
                        organizationId,
                        updatedOrder.contact.phone,
                        message
                    );
                } catch (notifyError) {
                    console.error('[OrdersService] Failed to send automated notification:', notifyError.message);
                    // We don't fail the whole request if only notification fails
                }
            }

            // AUTOMATION: If order is rejected, notify the customer
            if (dto.status === 'REJECTED' && updatedOrder.contact?.phone) {
                console.log(`[OrdersService] Order rejected. Triggering automated notification for ${updatedOrder.contact.phone}`);

                try {
                    const message = `Olá ${updatedOrder.contact.name || ''}! 👋\n\n` +
                        `Lamentamos informar que o seu pedido *#${updatedOrder.id.slice(0, 8)}* não pôde ser processado e foi cancelado. ❌\n\n` +
                        `*Motivo:* ${updatedOrder.rejectionReason || 'Não especificado'}\n\n` +
                        `Se tiver alguma dúvida, por favor entre em contacto connosco.`;

                    await this.whatsappService.sendNotification(
                        organizationId,
                        updatedOrder.contact.phone,
                        message
                    );
                } catch (notifyError) {
                    console.error('[OrdersService] Failed to send rejection notification:', notifyError.message);
                }
            }

            return updatedOrder;
        } catch (error) {
            console.error('[OrdersService] Update failed:', error.message);
            // Re-throw so controller catches it
            throw error;
        }
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
