import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserService } from '../user/user.service';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const hashedPassword = `${salt}.${hash.toString('hex')}`;

    const newUser = await this.userService.create(email, hashedPassword);
    return newUser;
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.userService.findByEmail(email, true);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
