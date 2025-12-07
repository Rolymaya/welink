import { IsString } from 'class-validator';

export class SendPlaygroundMessageDto {
    @IsString()
    sessionId: string;

    @IsString()
    content: string;
}
