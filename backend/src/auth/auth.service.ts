import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
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

    async register(email: string, pass: string, role: Role = Role.COMPANY_ADMIN) {
        const userCount = await this.prisma.user.count();
        const finalRole = userCount === 0 ? Role.SUPER_ADMIN : role;

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

    async updateProfile(userId: string, data: { name?: string; email?: string; password?: string; phone?: string; profilePhoto?: string }) {
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.profilePhoto !== undefined) updateData.profilePhoto = data.profilePhoto;

        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        const { passwordHash, ...result } = user;
        return result;
    }

    async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
        // Ensure uploads directory exists
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, '../../uploads/profile-photos');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `${userId}-${Date.now()}${fileExt}`;
        const filePath = path.join(uploadDir, fileName);

        // Write file to disk
        fs.writeFileSync(filePath, file.buffer);

        const publicUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/profile-photos/${fileName}`;

        // Cast to any to avoid lint error if Prisma Client types are stale
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { profilePhoto: publicUrl } as any,
        });

        const { passwordHash, ...result } = user;
        return result;
    }


    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            // Don't reveal if user exists
            return { message: 'If this email exists, a reset link has been sent.' };
        }

        const resetToken = uuidv4();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Send Email
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

        const emailSent = await this.emailService.sendEmail(
            user.email,
            'Redefinição de Senha - WeLinkAI',
            `
            <h1>Redefinição de Senha</h1>
            <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou isso, ignore este email.</p>
            `
        );

        if (!emailSent) {
            console.log(`[EMAIL FALLBACK] Password Reset Link for ${user.email}: ${resetLink}`);
        }

        return { message: 'If this email exists, a reset link has been sent.' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: dto.token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired token');
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
}
