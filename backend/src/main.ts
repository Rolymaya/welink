import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global Error Handlers to prevent crash on transient socket errors
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
        // Prevent exit
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Prevent exit
    });

    // Increase payload limit
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    // Global Validation Pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    // CORS - Secure configuration for production
    app.enableCors({
        origin: true, // Allow requests from any origin (reflects request origin)
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Disposition'],
    });

    // Swagger Setup
    // const config = new DocumentBuilder()
    //     .setTitle('SaaS AI Agent Platform API')
    //     .setDescription('The API description for the AI Agent SaaS')
    //     .setVersion('1.0')
    //     .addBearerAuth()
    //     .build();
    // const document = SwaggerModule.createDocument(app, config);
    // SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
});
