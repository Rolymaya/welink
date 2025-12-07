const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: 'admin@empresa.com' },
        include: { organization: true },
    });

    if (existingUser) {
        console.log('✅ User already exists!');
        console.log('Organization:', existingUser.organization.name);
        console.log('\n📧 Email: admin@empresa.com');
        console.log('🔑 Password: password123');
        return;
    }

    // Create or get organization
    const org = await prisma.organization.upsert({
        where: { slug: 'empresa-teste' },
        update: {},
        create: {
            name: 'Empresa Teste',
            slug: 'empresa-teste'
        },
    });

    console.log('✅ Organization created/found:', org.name);

    // Create company admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
        data: {
            email: 'admin@empresa.com',
            name: 'Admin Empresa',
            passwordHash: hashedPassword,
            role: 'COMPANY_ADMIN',
            organizationId: org.id,
        },
    });

    console.log('✅ User created:', user.name);
    console.log('\n🎉 Login credentials:');
    console.log('📧 Email: admin@empresa.com');
    console.log('🔑 Password: password123');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
