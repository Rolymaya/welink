import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
    @ApiProperty({ description: 'ID of the agent to link this session to' })
    @IsString()
    agentId: string;

    @ApiProperty({ description: 'Optional name for this session', required: false })
    @IsOptional()
    @IsString()
    name?: string;
}
