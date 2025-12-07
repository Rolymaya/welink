import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ContactService } from './contact.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateContactDto } from './dto/create-contact.dto';
import { LimitGuard, CheckLimit } from '../auth/guards/limit.guard';
import { PlanGuard } from '../auth/guards/plan.guard';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlanGuard)
@Controller('contacts')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

    @Post()
    @UseGuards(LimitGuard)
    @CheckLimit('contacts')
    create(@Request() req, @Body() createContactDto: CreateContactDto) {
        return this.contactService.create(req.user.orgId, createContactDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.contactService.findAll(req.user.orgId);
    }
}
