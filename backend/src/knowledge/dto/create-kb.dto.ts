import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKBDto {
    @ApiProperty({ example: 'My Document', description: 'Name of the knowledge base' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'Product Manual', description: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;
}
