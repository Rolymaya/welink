import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private prisma: PrismaService) { }

    private async getTransporter() {
        const settings = await this.prisma.systemSetting.findMany({
            where: {
                key: {
                    in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SMTP_FROM'],
                },
            },
        });

        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
            this.logger.warn('SMTP settings not configured');
            return null;
        }

        return nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: parseInt(config.SMTP_PORT || '587'),
            secure: config.SMTP_SECURE === 'true',
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        const transporter = await this.getTransporter();

        if (!transporter) {
            this.logger.warn(`Email to ${to} skipped: SMTP not configured`);
            // Fallback to console log for dev/testing if no SMTP
            console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}, Body: ${html}`);
            return false;
        }

        const fromEmail = await this.prisma.systemSetting.findUnique({
            where: { key: 'SMTP_FROM' },
        });

        try {
            const info = await transporter.sendMail({
                from: fromEmail?.value || '"WeLinkAI" <noreply@welink.ai>',
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to ${to}. MessageId: ${info.messageId}. Response: ${info.response}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
            return false;
        }
    }
}
