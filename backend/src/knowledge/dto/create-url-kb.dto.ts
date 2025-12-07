import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUrlKBDto {
    @ApiProperty({ example: 'Company Website', description: 'Name of the knowledge base' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'https://example.com', description: 'URL to ingest' })
    @IsString()
    @IsNotEmpty()
    @IsUrl()
    url: string;

    @ApiPropertyOptional({ example: 'Main website content', description: 'Description' })
    @IsOptional()
    @IsString()
    description?: string;
}
