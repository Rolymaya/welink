import { Controller, Post, Body, UseGuards, Request, Get, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    async login(@Body() req) {
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    async register(@Body() req) {
        return this.authService.register(req.email, req.password);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile') // Using Post or Patch, usually Patch is better but let's stick to standard if needed. Let's use Patch as planned.
    @ApiOperation({ summary: 'Update user profile' })
    async updateProfile(@Request() req, @Body() body: { name?: string; email?: string; password?: string; phone?: string; profilePhoto?: string }) {
        return this.authService.updateProfile(req.user.id, body);
    }

    @Post('profile/photo')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        }
    }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadProfilePhoto(@Request() req, @UploadedFile() file: Express.Multer.File) {
        console.log('Upload profile photo request received');
        console.log('User from JWT:', req.user);
        if (!file) {
            console.error('No file uploaded');
            throw new Error('No file uploaded');
        }
        console.log('File details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        });
        return this.authService.uploadProfilePhoto(req.user.id, file);
    }
}
