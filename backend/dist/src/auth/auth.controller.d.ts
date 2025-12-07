import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
            organizationId: any;
        };
    }>;
    register(req: any): Promise<{
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
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(req: any): any;
    updateProfile(req: any, body: {
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
    uploadProfilePhoto(req: any, file: Express.Multer.File): Promise<{
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
}
