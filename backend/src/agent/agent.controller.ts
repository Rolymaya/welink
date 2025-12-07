import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LimitGuard, CheckLimit } from '../auth/guards/limit.guard';
import { PlanGuard } from '../auth/guards/plan.guard';

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlanGuard)
@Controller('agents')
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Post()
    @UseGuards(LimitGuard)
    @CheckLimit('agents')
    create(@Request() req, @Body() createAgentDto: CreateAgentDto) {
        return this.agentService.create(req.user.orgId, createAgentDto);
    }

    @Get()
    findAll(@Request() req) {
        console.log('GET /agents called by user:', req.user);
        return this.agentService.findAll(req.user.orgId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.agentService.findOne(id, req.user.orgId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto, @Request() req) {
        return this.agentService.update(id, req.user.orgId, updateAgentDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.agentService.remove(id, req.user.orgId);
    }

    @Post(':id/chat')
    chat(@Param('id') id: string, @Body('message') message: string, @Request() req) {
        return this.agentService.chat(id, req.user.orgId, message);
    }
}
