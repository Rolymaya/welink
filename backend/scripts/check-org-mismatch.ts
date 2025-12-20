
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Organization Data Summary ---');

    const orgs = await prisma.organization.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    agents: true,
                    orders: true
                }
            },
            users: {
                select: { email: true, role: true }
            },
            agents: {
                select: { name: true, isActive: true }
            }
        }
    });

    console.log(`Found ${orgs.length} Organizations:\n`);

    for (const org of orgs) {
        if (org._count.users === 0 && org._count.agents === 0 && org._count.orders === 0) {
            continue; // Skip empty orgs to reduce noise
        }

        console.log(`[${org.name}] (ID: ${org.id})`);
        console.log(`  Counts: Users=${org._count.users}, Agents=${org._count.agents}, Orders=${org._count.orders}`);

        if (org.users.length > 0) {
            console.log(`  Users:`);
            org.users.forEach(u => console.log(`    - ${u.email} (${u.role})`));
        }

        if (org.agents.length > 0) {
            console.log(`  Agents:`);
            org.agents.forEach(a => console.log(`    - ${a.name} (Active: ${a.isActive})`));
        }
        console.log('');
    }

    console.log('--- Unlinked Elements ---');
    const orphanOrders = await prisma.order.count({ where: { organizationId: null } }); // Should be impossible via schema but good to check
    console.log(`Orphan Orders (Active Safety Check): ${orphanOrders}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
