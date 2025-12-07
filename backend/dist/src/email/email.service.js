"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async getTransporter() {
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
        }, {});
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
    async sendEmail(to, subject, html) {
        const transporter = await this.getTransporter();
        if (!transporter) {
            this.logger.warn(`Email to ${to} skipped: SMTP not configured`);
            console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}, Body: ${html}`);
            return false;
        }
        const fromEmail = await this.prisma.systemSetting.findUnique({
            where: { key: 'SMTP_FROM' },
        });
        try {
            const info = await transporter.sendMail({
                from: (fromEmail === null || fromEmail === void 0 ? void 0 : fromEmail.value) || '"WeLinkAI" <noreply@welink.ai>',
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to ${to}. MessageId: ${info.messageId}. Response: ${info.response}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
            return false;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailService);
//# sourceMappingURL=email.service.js.map