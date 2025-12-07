import { IsString, IsArray, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLLMProviderDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    apiKey: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    baseUrl?: string;

    @ApiProperty()
    @IsString()
    models: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    defaultModel?: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsInt()
    @IsOptional()
    priority?: number;
}
