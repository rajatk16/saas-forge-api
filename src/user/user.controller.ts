import { Request } from 'express';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './guards/JwtAuth.guard';

@Controller('user')
export class UserController {
  @Get('/current')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: Request) {
    return req.user ?? {};
  }
}
