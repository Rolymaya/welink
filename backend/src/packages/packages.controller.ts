import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Inject } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
    constructor(@Inject(PackagesService) private readonly packagesService: PackagesService) { }

    // Public endpoint for landing page
    @Get('public')
    findPublic() {
        return this.packagesService.findActive();
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles('SUPER_ADMIN')
    create(@Body() createPackageDto: CreatePackageDto) {
        return this.packagesService.create(createPackageDto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    @Roles('SUPER_ADMIN')
    findAll() {
        return this.packagesService.findAll();
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('active')
    @Roles('COMPANY_ADMIN')
    findActive() {
        return this.packagesService.findActive();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.packagesService.findOne(id);
    }

    @Patch(':id')
    @Roles('SUPER_ADMIN')
    update(@Param('id') id: string, @Body() updatePackageDto: UpdatePackageDto) {
        return this.packagesService.update(id, updatePackageDto);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN')
    remove(@Param('id') id: string) {
        return this.packagesService.remove(id);
    }
}
