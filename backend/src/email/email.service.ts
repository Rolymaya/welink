import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(@Inject(PrismaService) private prisma: PrismaService) { }

    private async getTransporter() {
        // 1. Try Database Settings
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

        // 2. Fallback to Environment Variables
        const host = config.SMTP_HOST || process.env.SMTP_HOST;
        const user = config.SMTP_USER || process.env.SMTP_USER;
        const pass = config.SMTP_PASS || process.env.SMTP_PASS;
        const port = config.SMTP_PORT || process.env.SMTP_PORT || '587';
        const secure = config.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'true';

        if (!host || !user || !pass) {
            this.logger.warn('SMTP settings not configured (checked DB and Env)');
            return null;
        }

        return nodemailer.createTransport({
            host,
            port: parseInt(port),
            secure,
            auth: { user, pass },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        const transporter = await this.getTransporter();

        if (!transporter) {
            this.logger.warn(`Email to ${to} skipped: SMTP not configured`);
            console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
            return false;
        }

        const fromEmail = (await this.prisma.systemSetting.findUnique({ where: { key: 'SMTP_FROM' } }))?.value
            || process.env.SMTP_FROM
            || '"WeLinkAI" <noreply@welink.ai>';

        try {
            const info = await transporter.sendMail({
                from: fromEmail,
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to ${to}. MessageId: ${info.messageId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
            return false;
        }
    }

    async sendPaymentProofNotification(adminEmail: string, orderDetails: any) {
        const subject = `[COMPROVATIVO] Novo pagamento para Encomenda #${orderDetails.orderId.slice(0, 8)}`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2563eb;">Novo Comprovativo de Pagamento Recebido</h2>
                <p>O cliente <strong>${orderDetails.customerName}</strong> enviou uma imagem/comprovativo via WhatsApp.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Encomenda:</strong> #${orderDetails.orderId}</p>
                    <p><strong>Valor Total:</strong> ${Number(orderDetails.totalAmount).toLocaleString('pt-AO')} Kz</p>
                    <p><strong>Telefone:</strong> ${orderDetails.phoneNumber}</p>
                    <p><strong>Data:</strong> ${new Date().toLocaleString('pt-AO')}</p>
                </div>

                <p>Por favor, verifique a imagem no WhatsApp e valide o pagamento no painel.</p>

                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/company/orders" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                    Aceder ao Painel
                </a>
            </div>
        `;

        return this.sendEmail(adminEmail, subject, html);
    }

    async sendNewOrderNotification(adminEmail: string, orderDetails: any) {
        const subject = `[NOVA ENCOMENDA] #${orderDetails.orderId.slice(0, 8)} - ${orderDetails.customerName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #10b981;">Nova Encomenda Recebida! 🎉</h2>
                <p>O cliente <strong>${orderDetails.customerName}</strong> acabou de realizar uma nova encomenda.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Encomenda:</strong> #${orderDetails.orderId}</p>
                    <p><strong>Valor Total:</strong> ${Number(orderDetails.totalAmount).toLocaleString('pt-AO')} Kz</p>
                    <p><strong>Itens:</strong> ${orderDetails.itemCount}</p>
                    <p><strong>Data:</strong> ${new Date().toLocaleString('pt-AO')}</p>
                </div>

                <p>Aceda ao painel para rever e aprovar a encomenda.</p>

                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/company/orders" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                    Gerir Encomendas
                </a>
            </div>
        `;

        return this.sendEmail(adminEmail, subject, html);
    }
}
