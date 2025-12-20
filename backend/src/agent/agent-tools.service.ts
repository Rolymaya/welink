import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import { AgendaService } from '../agenda/agenda.service';

@Injectable()
export class AgentToolsService {
    constructor(
        private productsService: ProductsService,
        private ordersService: OrdersService,
        private affiliatesService: AffiliatesService, // Inject AffiliatesService
        private agendaService: AgendaService, // Inject
    ) { }

    /**
     * Tool: catalog_search
     * Searches for products by name/description
     */
    async catalogSearch(organizationId: string, query: string, category?: string) {
        let products = [];
        const genericTerms = ['produtos', 'todos', 'lista', 'catalogo', 'catálogo', 'ver'];
        const isGeneric = !query || genericTerms.some(term => query.toLowerCase().includes(term));

        if (isGeneric && !category) {
            products = await this.productsService.findAll(organizationId);
        } else {
            products = await this.productsService.searchProducts(organizationId, query, category);
        }

        return products.map(product => {
            // Format price: 1000 -> "1.000kz"
            const formattedPrice = new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(Number(product.price)) + 'kz';

            // normalize description
            let desc = product.description;
            if (!desc || desc === '(sem descrição)' || desc.toLowerCase() === 'sem descrição') {
                desc = null;
            }

            return {
                id: product.id,
                name: product.name,
                description: desc,
                price: formattedPrice, // Send pre-formatted price
                category: product.category,
                // REMOVED: stock - AI should use check_availability for stock info, not cache it
                isPhysical: product.isPhysical,
            };
        });
    }

    /**
     * Tool: check_availability
     * Checks if a specific product is available in the requested quantity
     */
    async checkAvailability(productId: string, quantity: number) {
        return await this.productsService.checkAvailability(productId, quantity);
    }

    /**
     * Tool: create_order
     * Creates a new order for a customer
     */
    async createOrder(
        organizationId: string,
        contactId: string,
        items: Array<{ productId: string; quantity: number }>,
        deliveryAddress: string
    ) {
        console.log('[AgentTools] CreateOrder Called:', { organizationId, contactId, items, deliveryAddress });
        try {
            const order = await this.ordersService.create(organizationId, {
                contactId,
                items,
                deliveryAddress,
            });
            console.log('[AgentTools] Order Created Success:', order.id);

            return {
                success: true,
                orderId: order.id,
                total: order.totalAmount,
                message: `Pedido #${order.id.slice(0, 8)} criado com sucesso! Total: ${Number(order.totalAmount).toLocaleString()} Kz`,
            };
        } catch (error) {
            console.error('[AgentTools] Order Creation Failed:', error);
            return {
                success: false,
                message: error.message || 'Erro ao criar pedido',
            };
        }
    }

    /**
     * Tool: get_order_status
     * Gets the status of customer's recent orders
     */
    async getOrderStatus(contactId: string) {
        const orders = await this.ordersService.getContactOrders(contactId);

        if (orders.length === 0) {
            return { message: 'Nenhum pedido encontrado' };
        }

        return orders.map(order => ({
            orderId: order.id.slice(0, 8),
            status: this.translateStatus(order.status),
            total: order.totalAmount,
            createdAt: order.createdAt,
            items: order.items.map(item => ({
                product: item.productNameSnapshot,
                quantity: item.quantity,
            })),
        }));
    }

    private translateStatus(status: string): string {
        const translations = {
            PENDING: 'Pendente de aprovação',
            AWAITING_PAYMENT: 'Aguardando pagamento',
            PROCESSING: 'Em processamento',
            SHIPPED: 'Enviado',
            COMPLETED: 'Concluído',
            REJECTED: 'Rejeitado',
        };
        return translations[status] || status;
    }

    /**
     * Tool: get_bank_accounts
     * Retrieves active bank accounts for payment
     */
    async getBankAccounts(organizationId: string) {
        // Use Affiliates Service to get company bank accounts
        const accounts = await this.affiliatesService.getBankAccounts(organizationId);

        if (!accounts || accounts.length === 0) {
            return { message: 'Nenhuma conta bancária disponível no momento.' };
        }

        return accounts.map(acc => ({
            bank: acc.bankName,
            accountNumber: acc.accountNumber, // Conta (Nº)
            iban: acc.iban,
            beneficiary: acc.accountHolder
        }));
    }

    /**
     * Tool: schedule_follow_up
     * Schedules a reminder for the admin to contact the client
     */
    async scheduleFollowUp(organizationId: string, contactId: string, query: string) {
        // Create an agenda item
        const summary = `Cliente aguardando informação sobre: ${query}`;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // Default to next day 9 AM

        await this.agendaService.create({
            subject: 'Retorno ao Cliente (Informação Pendente)',
            summary: summary,
            date: tomorrow,
            organizationId,
            contactId,
            client: 'Cliente WhatsApp' // fallback name
        });

        return { success: true, message: 'Agendamento criado para o administrador.' };
    }

    /**
     * Generates the function definitions for OpenAI function calling
     */
    getFunctionDefinitions() {
        return [
            {
                name: 'catalog_search',
                description: 'Busca produtos no catálogo por nome, descrição ou categoria. Use para mostrar opções ao cliente.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Termo de busca (nome ou descrição do produto)',
                        },
                        category: {
                            type: 'string',
                            description: 'Categoria específica para filtrar (opcional)',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'check_availability',
                description: 'Verifica se um produto específico está disponível na quantidade desejada',
                parameters: {
                    type: 'object',
                    properties: {
                        productId: {
                            type: 'string',
                            description: 'UUID do produto retornado pelo catalog_search. Use SEMPRE o campo "id" do resultado, NUNCA o nome.',
                        },
                        quantity: {
                            type: 'number',
                            description: 'Quantidade desejada',
                        },
                    },
                    required: ['productId', 'quantity'],
                },
            },
            {
                name: 'create_order',
                description: 'Cria um pedido para o cliente. APENAS use após confirmar todos os itens e o endereço de entrega com o cliente.',
                parameters: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            description: 'Lista de produtos e quantidades',
                            items: {
                                type: 'object',
                                properties: {
                                    productId: {
                                        type: 'string',
                                        description: 'UUID do produto (campo "id" do catalog_search)'
                                    },
                                    quantity: { type: 'number' },
                                },
                                required: ['productId', 'quantity'],
                            },
                        },
                        deliveryAddress: {
                            type: 'string',
                            description: 'Endereço de entrega fornecido pelo cliente. ACEITE qualquer formato que o cliente passar (ex: "Calemba 2 perto da farmácia"). NÃO peça código postal ou detalhes se o cliente não oferecer espontaneamente.',
                        },
                    },
                    required: ['items', 'deliveryAddress'],
                },
            },
            {
                name: 'get_order_status',
                description: 'Consulta o status dos pedidos recentes do cliente',
                parameters: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_bank_accounts',
                description: 'Busca as contas bancárias ativas da empresa para enviar ao cliente',
                parameters: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'schedule_follow_up',
                description: 'Agenda um lembrete para a administração quando você NÃO sabe uma informação solicitada. Use isso em vez de perguntar ao cliente.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'O que o cliente perguntou e você não soube responder',
                        },
                    },
                    required: ['query'],
                },
            },
        ];
    }
}
