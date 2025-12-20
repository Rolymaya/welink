
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsService } from './products/products.service';
import { IngestionService } from './knowledge/ingestion.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        ProductsModule,
        KnowledgeModule
    ]
})
class ReindexModule { }

async function bootstrap() {
    console.log('Initializing Reindex Script...');
    const app = await NestFactory.createApplicationContext(ReindexModule);
    const ingestionService = app.get(IngestionService);
    const prisma = app.get(PrismaService);

    const orgId = 'edc248f5-309c-466a-ad45-1d0e114250af';
    console.log(`Starting re-indexing for Org: ${orgId}`);

    const products = await prisma.product.findMany({
        where: { organizationId: orgId, isActive: true }
    });

    console.log(`Found ${products.length} active products to index.`);

    for (const product of products) {
        process.stdout.write(`Indexing: ${product.name}... `);
        await ingestionService.indexProduct(product, orgId);
        console.log('Done');
    }

    console.log('Re-indexing complete!');
    await app.close();
    process.exit(0);
}

bootstrap().catch(e => {
    console.error(e);
    process.exit(1);
});
