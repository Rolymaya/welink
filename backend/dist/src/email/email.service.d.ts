import { PrismaService } from '../prisma/prisma.service';
export declare class EmailService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getTransporter;
    sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}
