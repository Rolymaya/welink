import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveSubscriptionDto {
    @ApiProperty({ enum: ['ACTIVE', 'CANCELLED'] })
    @IsEnum(['ACTIVE', 'CANCELLED'])
    status: 'ACTIVE' | 'CANCELLED';
}
