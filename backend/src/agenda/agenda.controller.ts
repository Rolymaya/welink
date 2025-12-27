import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Inject } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@Controller('agenda')
@UseGuards(JwtAuthGuard)
export class AgendaController {
    constructor(@Inject(AgendaService) private readonly agendaService: AgendaService) { }

    @Post()
    create(@Request() req, @Body() createAgendaDto: CreateAgendaDto) {
        return this.agendaService.create({
            ...createAgendaDto,
            date: new Date(createAgendaDto.date),
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
    update(@Param('id') id: string, @Body() updateAgendaDto: UpdateAgendaDto) {
        const updateData: any = { ...updateAgendaDto };
        if (updateAgendaDto.date) {
            updateData.date = new Date(updateAgendaDto.date);
        }
        return this.agendaService.update(id, updateData);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.agendaService.remove(id);
    }
}
