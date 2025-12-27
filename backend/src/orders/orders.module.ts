import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        PrismaModule,
        ProductsModule,
        BankAccountsModule,
        AffiliatesModule,
        forwardRef(() => WhatsAppModule),
        EmailModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
