"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'superadmin@welink.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
        },
        create: {
            email,
            passwordHash: hashedPassword,
            role: client_1.Role.SUPER_ADMIN,
        },
    });
    console.log({ user });
    const basicPackage = await prisma.package.upsert({
        where: { id: 'basic-package-id' },
        update: {},
        create: {
            id: 'basic-package-id',
            name: 'Basic',
            description: 'Perfect for small teams getting started with AI agents',
            price: 50,
            durationDays: 30,
            maxAgents: 2,
            maxSessions: 5,
            maxContacts: 100,
            allowAudioResponse: false,
            allowScheduling: true,
        },
    });
    const proPackage = await prisma.package.upsert({
        where: { id: 'pro-package-id' },
        update: {},
        create: {
            id: 'pro-package-id',
            name: 'Pro',
            description: 'For growing businesses that need more power',
            price: 150,
            durationDays: 30,
            maxAgents: 10,
            maxSessions: 20,
            maxContacts: 1000,
            allowAudioResponse: true,
            allowScheduling: true,
        },
    });
    const enterprisePackage = await prisma.package.upsert({
        where: { id: 'enterprise-package-id' },
        update: {},
        create: {
            id: 'enterprise-package-id',
            name: 'Enterprise',
            description: 'Unlimited power for large organizations',
            price: 500,
            durationDays: 30,
            maxAgents: 100,
            maxSessions: 200,
            maxContacts: 10000,
            allowAudioResponse: true,
            allowScheduling: true,
        },
    });
    console.log({ basicPackage, proPackage, enterprisePackage });
    await prisma.systemSetting.upsert({
        where: { key: 'PLAYGROUND_MAX_AGENTS_PER_ORG' },
        update: {},
        create: {
            key: 'PLAYGROUND_MAX_AGENTS_PER_ORG',
            value: '1',
        },
    });
    await prisma.systemSetting.upsert({
        where: { key: 'PLAYGROUND_DAILY_MSG_LIMIT' },
        update: {},
        create: {
            key: 'PLAYGROUND_DAILY_MSG_LIMIT',
            value: '200',
        },
    });
    await prisma.systemSetting.upsert({
        where: { key: 'PLAYGROUND_RETENTION_DAYS' },
        update: {},
        create: {
            key: 'PLAYGROUND_RETENTION_DAYS',
            value: '7',
        },
    });
    console.log('Playground settings created');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map