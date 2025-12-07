import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
    @ApiPropertyOptional({ example: 'Minha Empresa Ltda' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'data:image/png;base64,...' })
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional({ example: 'Retail' })
    @IsOptional()
    @IsString()
    sector?: string;

    @ApiPropertyOptional({ example: 'Updated description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: { monday: { open: '09:00', close: '18:00' } } })
    @IsOptional()
    @IsObject()
    businessHours?: object;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    privacyPolicy?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    termsOfService?: string;
}
