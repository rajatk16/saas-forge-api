import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/RegisterUser.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() body: RegisterUserDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('/login')
  async login(@Body() body: RegisterUserDto) {
    return this.authService.login(body.email, body.password);
  }
}
