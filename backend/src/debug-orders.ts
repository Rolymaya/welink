
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching last 10 orders...');
    const orders = await prisma.order.findMany({
        take: 10,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            contact: true,
            organization: true,
        }
    });

    if (orders.length === 0) {
        console.log('No orders found in database.');
    } else {
        console.table(orders.map(o => ({
            id: o.id,
            orgId: o.organizationId,
            orgName: o.organization?.name,
            contact: o.contact?.name,
            total: o.totalAmount,
            status: o.status,
            createdAt: o.createdAt.toISOString()
        })));
    }

    console.log('\nFetching active Agents...');
    const agents = await prisma.agent.findMany({
        include: { organization: true }
    });
    console.table(agents.map(a => ({
        id: a.id,
        name: a.name,
        orgId: a.organizationId,
        orgName: a.organization?.name,
        active: a.isActive
    })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
