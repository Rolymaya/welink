import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private ordersService: OrdersService) { }

    @Post()
    async create(@Request() req, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(req.user.organizationId, dto);
    }

    @Get()
    async findAll(@Request() req, @Query('status') status?: string) {
        return this.ordersService.findAll(req.user.organizationId, status);
    }

    @Get(':id')
    async findOne(@Request() req, @Param('id') id: string) {
        return this.ordersService.findOne(id, req.user.organizationId);
    }

    @Patch(':id/status')
    @Roles('COMPANY_ADMIN')
    async updateStatus(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdateOrderStatusDto
    ) {
        return this.ordersService.updateStatus(id, req.user.organizationId, dto);
    }
}
