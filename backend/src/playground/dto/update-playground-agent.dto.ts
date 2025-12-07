import { IsString, IsOptional } from 'class-validator';

export class UpdatePlaygroundAgentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    prompt?: string;
}
