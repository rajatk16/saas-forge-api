import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Body, Controller, ForbiddenException, Post, Req, Res, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterUserDto } from './dtos/RegisterUser.dto';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';
import { JwtAuthGuard } from '../user/guards/JwtAuth.guard';

declare module 'express' {
  interface Request {
    user: {
      userId: string;
      email: string;
      roles: string[];
      isActive: boolean;
    };
  }
}

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
  async login(@Res({ passthrough: true }) res: Response, @Body() body: RegisterUserDto) {
    const { email, password } = body;

    const tokens = await this.authService.login(email, password);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return tokens;
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

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { userId } = req.user;
    await this.userService.removeRefreshToken(userId);

    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }
}
