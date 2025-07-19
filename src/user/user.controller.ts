import { Request } from 'express';
import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';

import { UserService } from './user.service';
import { JwtAuthGuard } from './guards/JwtAuth.guard';
import { UserTenantDto } from './dtos/UserTenant.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/user/:id')
  @UseGuards(JwtAuthGuard)
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('/current')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: Request) {
    const user = req.user;

    return this.userService.findById(user.userId);
  }

  @Patch('/user/deactivate')
  @UseGuards(JwtAuthGuard)
  deactivateUser(@Req() req: Request) {
    const user = req.user;

    return this.userService.deactivateUser(user.userId);
  }

  @Patch('/user/activate')
  @UseGuards(JwtAuthGuard)
  activateUser(@Req() req: Request) {
    const user = req.user;

    return this.userService.activateUser(user.userId);
  }

  @Patch('/user/addTenant')
  @UseGuards(JwtAuthGuard)
  addTenantToUser(@Req() req: Request, @Body() body: UserTenantDto) {
    const user = req.user;

    return this.userService.addTenantToUser(user.userId, body.tenantId);
  }

  @Patch('/user/removeTenant')
  @UseGuards(JwtAuthGuard)
  removeTenantFromUser(@Req() req: Request, @Body() body: UserTenantDto) {
    const user = req.user;

    return this.userService.removeTenantFromUser(user.userId, body.tenantId);
  }

  @Patch('/user/setDefaultTenant')
  @UseGuards(JwtAuthGuard)
  setDefaultTenant(@Req() req: Request, @Body() body: UserTenantDto) {
    const user = req.user;

    return this.userService.setDefaultTenant(user.userId, body.tenantId);
  }
}
