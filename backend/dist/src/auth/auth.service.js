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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async validateUser(email, pass) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash } = user, result = __rest(user, ["passwordHash"]);
            return result;
        }
        return null;
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id, role: user.role, orgId: user.organizationId };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
            },
        };
    }
    async register(email, pass, role = client_1.Role.COMPANY_ADMIN) {
        const userCount = await this.prisma.user.count();
        const finalRole = userCount === 0 ? client_1.Role.SUPER_ADMIN : role;
        const hashedPassword = await bcrypt.hash(pass, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role: finalRole,
            },
        });
        return user;
    }
    async updateProfile(userId, data) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.profilePhoto !== undefined)
            updateData.profilePhoto = data.profilePhoto;
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        const { passwordHash } = user, result = __rest(user, ["passwordHash"]);
        return result;
    }
    async uploadProfilePhoto(userId, file) {
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, '../../uploads/profile-photos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileExt = path.extname(file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExt}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        const publicUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/profile-photos/${fileName}`;
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { profilePhoto: publicUrl },
        });
        const { passwordHash } = user, result = __rest(user, ["passwordHash"]);
        return result;
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            return { message: 'If this email exists, a reset link has been sent.' };
        }
        const resetToken = (0, uuid_1.v4)();
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
        const emailSent = await this.emailService.sendEmail(user.email, 'Redefinição de Senha - WeLinkAI', `
            <h1>Redefinição de Senha</h1>
            <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou isso, ignore este email.</p>
            `);
        if (!emailSent) {
            console.log(`[EMAIL FALLBACK] Password Reset Link for ${user.email}: ${resetLink}`);
        }
        return { message: 'If this email exists, a reset link has been sent.' };
    }
    async resetPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: dto.token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        return { message: 'Password successfully reset' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map