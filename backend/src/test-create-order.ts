
import { PrismaClient } from '@prisma/client';
import { OrdersService } from './orders/orders.service';
import { ProductsService } from './products/products.service';

// Mock NestJS dependency injection
const prisma = new PrismaClient();
const productsService = new ProductsService(prisma);
const ordersService = new OrdersService(prisma, productsService);

async function main() {
    // 1. Get Organization
    const agents = await prisma.agent.findMany({ take: 1 });
    if (agents.length === 0) throw new Error('No agents found');
    const orgId = agents[0].organizationId;
    console.log('Using Org:', orgId);

    // 2. Get Product
    const products = await prisma.product.findMany({ where: { organizationId: orgId }, take: 1 });
    if (products.length === 0) throw new Error('No products found');
    const product = products[0];
    console.log('Using Product:', product.name, product.id);

    // 3. Get/Create Contact
    let contact = await prisma.contact.findFirst({ where: { organizationId: orgId } });
    if (!contact) {
        contact = await prisma.contact.create({
            data: {
                organizationId: orgId,
                name: 'Test User',
                phone: '123456789',
                tags: 'test'
            }
        });
    }
    console.log('Using Contact:', contact.name, contact.id);

    // 4. Create Order
    console.log('Attempting to create order...');
    try {
        const order = await ordersService.create(orgId, {
            contactId: contact.id,
            items: [{ productId: product.id, quantity: 1 }],
            deliveryAddress: 'Test Address 123'
        });
        console.log('SUCCESS: Order created!', order.id);
        console.log('Total:', order.totalAmount);
    } catch (error) {
        console.error('FAILURE: Failed to create order order:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
