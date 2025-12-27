import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateAgendaDto {
    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    client?: string;

    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsUUID()
    contactId?: string;
}
