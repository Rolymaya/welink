import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePackageDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsNumber()
    durationDays: number;

    @ApiProperty()
    @IsNumber()
    maxAgents: number;

    @ApiProperty()
    @IsNumber()
    maxSessions: number;

    @ApiProperty()
    @IsNumber()
    maxContacts: number;

    @ApiProperty({ default: false })
    @IsBoolean()
    @IsOptional()
    allowAudioResponse?: boolean;

    @ApiProperty({ default: true })
    @IsBoolean()
    @IsOptional()
    allowScheduling?: boolean;

    @ApiProperty({ default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
