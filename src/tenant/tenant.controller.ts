import { Request } from 'express';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { TenantService } from './tenant.service';
import { TenantNameDto } from './dtos/tenantName.dto';
import { JwtAuthGuard } from '../user/guards/JwtAuth.guard';
import { TenantRolesGuard } from 'src/common/guards/TenantRoles.guard';
import { TenantRole } from 'src/common/enums/TenantRole.enum';
import { TenantRoles } from 'src/common/decorators/TenantRoles.decorator';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createTenant(@Req() req: Request, @Body() body: TenantNameDto) {
    const user = req.user;

    return this.tenantService.createTenant(user, body.name);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Get('/tenant/:id')
  async getTenant(@Param('id') id: string) {
    return this.tenantService.getTenant(id);
  }

  @Patch('/tenant/:id')
  async updateTenant(@Param('id') id: string, @Body() body: TenantNameDto) {
    return this.tenantService.updateTenant(id, body.name);
  }

  @Delete('/tenant/:id')
  async deleteTenant(@Param('id') id: string) {
    return this.tenantService.deleteTenant(id);
  }

  @Post('/tenant/:id/addUser')
  @UseGuards(JwtAuthGuard, TenantRolesGuard)
  @TenantRoles(TenantRole.OWNER, TenantRole.ADMIN)
  async addUserToTenant(
    @Req() req: Request,
    @Param('id') tenantId: string,
    @Body() body: { userId: string; role: TenantRole },
  ) {
    if (req.user.userId === body.userId) {
      throw new BadRequestException('You cannot add yourself to the tenant');
    }

    return this.tenantService.addUserToTenant(tenantId, body.userId, body.role);
  }

  @Delete('/tenant/:id/removeUser')
  @UseGuards(JwtAuthGuard, TenantRolesGuard)
  @TenantRoles(TenantRole.OWNER, TenantRole.ADMIN)
  async removeUserFromTenant(@Req() req: Request, @Param('id') tenantId: string, @Body() body: { userId: string }) {
    if (req.user.userId === body.userId) {
      throw new BadRequestException('You cannot remove yourself from the tenant');
    }

    return this.tenantService.removeUserFromTenant(tenantId, body.userId);
  }
}
