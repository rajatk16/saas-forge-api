import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterUserDto } from './dtos/RegisterUser.dto';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  @Post('/register')
  async register(@Body() body: RegisterUserDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('/login')
  async login(@Body() body: RegisterUserDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('/refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    const { refreshToken } = body;
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userService.findByEmail(payload.email as string);
      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Access denied.');
      }

      const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!tokenMatch) {
        throw new ForbiddenException('Invalid refresh token.');
      }

      const tokens = this.authService.generateTokens(user);
      await this.authService.updateRefreshToken(user.id as string, tokens.refreshToken);

      return tokens;
    } catch {
      throw new ForbiddenException('Token expired or invalid.');
    }
  }
}
