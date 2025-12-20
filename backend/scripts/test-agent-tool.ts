// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { AgentToolsService } from '../src/agent/agent-tools.service';
import { OrdersService } from '../src/orders/orders.service';
import { ProductsService } from '../src/products/products.service';
import { AffiliatesService } from '../src/affiliates/affiliates.service';
import { AgendaService } from '../src/agenda/agenda.service';

const prisma = new PrismaClient();

const mockProductsService = {
    checkAvailability: async (id, qty) => ({ available: true }),
    findAll: async () => [],
    searchProducts: async () => [],
};

const mockAffiliatesService = {
    getBankAccounts: async () => []
};

const mockAgendaService = {
    create: async () => ({})
};

// We need a real OrdersService to test persistence
const ordersService = new OrdersService(prisma, mockProductsService);

const agentToolsService = new AgentToolsService(
    mockProductsService,
    ordersService,
    mockAffiliatesService,
    mockAgendaService
);

async function main() {
    console.log('--- Simulating Agent Create Order Tool ---');

    // 1. Get Roly Ngalula Org
    const org = await prisma.organization.findFirst({
        where: { name: { contains: 'Roly' } }
    });

    if (!org) {
        console.error('Organization Roly Ngalula not found');
        return;
    }
    console.log(`Using Org: ${org.name} (${org.id})`);

    // 2. Get Contact
    let contact = await prisma.contact.findFirst({
        where: { organizationId: org.id }
    });
    if (!contact) {
        contact = await prisma.contact.create({
            data: { phone: '888888888', name: 'Simulated User', organizationId: org.id }
        });
    }
    console.log(`Using Contact: ${contact.name} (${contact.id})`);

    // 3. Get Product
    let product = await prisma.product.findFirst({
        where: { organizationId: org.id }
    });
    if (!product) {
        product = await prisma.product.create({
            data: {
                name: 'Simulated Product',
                description: 'Desc',
                price: 5000,
                organizationId: org.id,
                stock: 100
            }
        });
    }
    console.log(`Using Product: ${product.name} (${product.id})`);

    // 4. Call the Tool Method Directly (as the LLM would)
    console.log('Calling agentToolsService.createOrder...');

    // Simulate what the LLM passes (sometimes it passes strings as numbers, but here we assume correct types mostly)
    // The LLM gets the schema: items: [{ productId, quantity }], deliveryAddress
    const items = [{ productId: product.id, quantity: 2 }];
    const deliveryAddress = 'Rua da Simulação, 123';

    try {
        const result = await agentToolsService.createOrder(
            org.id,
            contact.id,
            items,
            deliveryAddress
        );

        console.log('Tool Result:', result);

        if (result.success) {
            console.log(`SUCCESS! Order Created ID: ${result.orderId}`);

            // Verify in DB
            const orderInDb = await prisma.order.findUnique({
                where: { id: result.orderId }
            });
            if (orderInDb) {
                console.log(`VERIFIED: Order found in DB with status ${orderInDb.status}`);
            } else {
                console.error('FATAL: Order Reported Success but NOT FOUND in DB');
            }
        } else {
            console.error('Tool returned success: false', result.message);
        }

    } catch (error) {
        console.error('Exception during tool execution:', error);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
