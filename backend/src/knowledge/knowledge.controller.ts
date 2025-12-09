import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { CreateKBDto } from './dto/create-kb.dto';
import { CreateUrlKBDto } from './dto/create-url-kb.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('knowledge')
@ApiBearerAuth()
@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
    constructor(private readonly knowledgeService: KnowledgeService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                name: { type: 'string' },
                description: { type: 'string' },
            },
        },
    })
    async uploadFile(@Request() req, @UploadedFile() file: Express.Multer.File, @Body() dto: CreateKBDto) {
        if (!file) {
            throw new Error('File is required');
        }
        return this.knowledgeService.createFromFile(req.user.orgId, dto, file);
    }

    @Post('url')
    async addUrl(@Request() req, @Body() dto: CreateUrlKBDto) {
        return this.knowledgeService.createFromUrl(req.user.orgId, dto);
    }

    @Get()
    async findAll(@Request() req) {
        return this.knowledgeService.findAll(req.user.orgId);
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        return this.knowledgeService.remove(id, req.user.orgId);
    }
}
