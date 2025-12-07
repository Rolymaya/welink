import { IsString, IsOptional } from 'class-validator';

export class CreatePlaygroundAgentDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    prompt: string;
}
