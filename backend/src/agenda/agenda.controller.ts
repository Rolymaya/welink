import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agenda')
@UseGuards(JwtAuthGuard)
export class AgendaController {
    constructor(private readonly agendaService: AgendaService) { }

    @Post()
    create(@Request() req, @Body() createAgendaDto: any) {
        return this.agendaService.create({
            ...createAgendaDto,
            organizationId: req.user.orgId,
        });
    }

    @Get()
    findAll(@Request() req) {
        return this.agendaService.findAll(req.user.orgId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.agendaService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAgendaDto: any) {
        return this.agendaService.update(id, updateAgendaDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.agendaService.remove(id);
    }
}
