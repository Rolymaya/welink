import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterOrganizationDto {
    @ApiProperty({ example: 'Minha Empresa', description: 'Name of the organization' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ example: 'E-commerce', description: 'Business sector' })
    @IsOptional()
    @IsString()
    sector?: string;

    @ApiPropertyOptional({ example: 'We sell amazing products', description: 'Organization description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'REF-123', description: 'Referral code from affiliate' })
    @IsOptional()
    @IsString()
    referralCode?: string;
}
