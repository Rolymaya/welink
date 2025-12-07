import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentDto {
    @ApiProperty({ example: 'Assistente de Vendas' })
    @IsString()
    @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
    name: string;

    @ApiProperty({
        example: 'Você é um assistente de vendas amigável e profissional. Ajude os clientes a encontrar produtos e responda suas dúvidas.',
        description: 'Prompt do sistema que define a personalidade e comportamento do agente'
    })
    @IsString()
    @MinLength(10, { message: 'O prompt deve ter pelo menos 10 caracteres' })
    prompt: string;

    @ApiProperty({ example: true, required: false })
    isActive?: boolean;
}
