// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { OrdersService } from '../src/orders/orders.service';

const prisma = new PrismaClient();

const mockProductsService = {
    checkAvailability: async (id, qty) => {
        return { available: true, reason: 'Mocked Available' };
    },
    // Add other methods if needed to satisfy usage in create()
    checkAvailability: async (id, qty) => ({ available: true })
};

// We are bypassing TS so this should run
// We need to make sure we don't crash on runtime if OrdersService calls other things
// OrdersService.create() calls:
// 1. this.productsService.checkAvailability
// 2. this.prisma.product.findUnique (multiple times)
// 3. this.prisma.order.create
// 4. this.prisma.product.update (if physical)

async function main() {
    console.log('--- Simulating Order Creation (NoCheck) ---');

    const ordersService = new OrdersService(prisma, mockProductsService);

    // 1. Get a valid Organization and Contact
    const org = await prisma.organization.findFirst({
        where: { agents: { some: {} } }
    });

    if (!org) {
        console.error('No organization with agent found. Cannot proceed.');
        return;
    }
    console.log(`Using Org: ${org.name} (${org.id})`);

    let contact = await prisma.contact.findFirst({
        where: { organizationId: org.id }
    });

    if (!contact) {
        console.log('Creating dummy contact...');
        contact = await prisma.contact.create({
            data: {
                phone: '999999999',
                name: 'Test Customer',
                organizationId: org.id
            }
        });
    }
    console.log(`Using Contact: ${contact.name} (${contact.id})`);

    // 2. Get a valid Product
    let product = await prisma.product.findFirst({
        where: { organizationId: org.id }
    });

    if (!product) {
        console.log('Creating dummy product...');
        product = await prisma.product.create({
            data: {
                name: 'Test Product',
                description: 'Test description',
                price: 1000,
                organizationId: org.id,
                stock: 100
            }
        });
    }
    console.log(`Using Product: ${product.name} (${product.id})`);

    // 3. Create Order
    console.log('Creating order...');
    try {
        const order = await ordersService.create(org.id, {
            contactId: contact.id,
            deliveryAddress: 'Test Address 123',
            items: [{
                productId: product.id,
                quantity: 1
            }]
        });

        console.log('Order created successfully!');
        console.log(`Order ID: ${order.id}`);
        console.log(`Total: ${order.totalAmount}`);
        console.log(`Status: ${order.status}`);

    } catch (error) {
        console.error('Failed to create order:', error);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
