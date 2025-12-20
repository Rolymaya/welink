import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Inject } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agenda')
@UseGuards(JwtAuthGuard)
export class AgendaController {
    constructor(@Inject(AgendaService) private readonly agendaService: AgendaService) { }

    @Post()
    create(@Request() req, @Body() createAgendaDto: any) {
        return this.agendaService.create({
            ...createAgendaDto,
            organizationId: req.user.organizationId,
        });
    }

    @Get()
    findAll(@Request() req) {
        return this.agendaService.findAll(req.user.organizationId);
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
