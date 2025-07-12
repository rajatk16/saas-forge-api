import { Request } from 'express';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './guards/JwtAuth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/current')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: Request) {
    return req.user ?? {};
  }

  @Get('/allUsers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}
