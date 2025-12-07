import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private emailService;
    constructor(prisma: PrismaService, jwtService: JwtService, emailService: EmailService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            organizationId: any;
        };
    }>;
    register(email: string, pass: string, role?: Role): Promise<{
        id: string;
        email: string;
        resetToken: string | null;
        passwordHash: string;
        name: string | null;
        phone: string | null;
        profilePhoto: string | null;
        role: import(".prisma/client").$Enums.Role;
        resetTokenExpiry: Date | null;
        organizationId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
        profilePhoto?: string;
    }): Promise<{
        id: string;
        email: string;
        resetToken: string | null;
        name: string | null;
        phone: string | null;
        profilePhoto: string | null;
        role: import(".prisma/client").$Enums.Role;
        resetTokenExpiry: Date | null;
        organizationId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<{
        id: string;
        email: string;
        resetToken: string | null;
        name: string | null;
        phone: string | null;
        profilePhoto: string | null;
        role: import(".prisma/client").$Enums.Role;
        resetTokenExpiry: Date | null;
        organizationId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
