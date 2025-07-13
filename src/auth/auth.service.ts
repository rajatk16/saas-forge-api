import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await this.userService.create(email, hashed);
    return newUser;
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.findByEmail(email, true);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);
    await this.updateRefreshToken(user.id as string, tokens.refreshToken);
    return tokens;
  }

  generateTokens(user: any) {
    const payload = {
      sub: user._id,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);
  }
}
