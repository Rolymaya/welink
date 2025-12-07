const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.playgroundSession.count();
    console.log('Session count:', count);
    
    const sessions = await prisma.playgroundSession.findMany({
        include: { agent: true }
    });
    console.log('Sessions:', JSON.stringify(sessions, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
