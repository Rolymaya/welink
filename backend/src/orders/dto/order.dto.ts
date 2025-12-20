import { IsString, IsArray, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
    @IsString()
    productId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsString()
    deliveryAddress: string;

    @IsString()
    contactId: string;
}

export class UpdateOrderStatusDto {
    @IsString()
    status: 'PENDING' | 'AWAITING_PAYMENT' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'REJECTED';

    @IsString()
    rejectionReason?: string;
}
