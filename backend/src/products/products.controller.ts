import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(private productsService: ProductsService) { }

    @Post()
    @Roles('COMPANY_ADMIN')
    async create(@Request() req, @Body() dto: CreateProductDto) {
        return this.productsService.create(req.user.organizationId, dto);
    }

    @Get()
    async findAll(@Request() req, @Query('includeInactive') includeInactive?: string) {
        return this.productsService.findAll(
            req.user.organizationId,
            includeInactive === 'true'
        );
    }

    @Get(':id')
    async findOne(@Request() req, @Param('id') id: string) {
        return this.productsService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    @Roles('COMPANY_ADMIN')
    async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.productsService.update(id, req.user.organizationId, dto);
    }

    @Delete(':id')
    @Roles('COMPANY_ADMIN')
    async delete(@Request() req, @Param('id') id: string) {
        return this.productsService.delete(id, req.user.organizationId);
    }
}
