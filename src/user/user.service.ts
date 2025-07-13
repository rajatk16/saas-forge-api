import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { User } from './schemas/user.schema';
import { UserResponseDto } from './dtos/UserResponse.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(email: string, password: string): Promise<UserResponseDto> {
    const user = new this.userModel({ email, password });
    const savedUser = await user.save();

    return plainToInstance(UserResponseDto, savedUser, { excludeExtraneousValues: true });
  }

  async findByEmail(email: string, includePassword: boolean = false) {
    const user = await this.userModel.findOne({ email }).select(includePassword ? '+password' : '');
    if (!user) {
      return null;
    }

    return user;
  }

  async getAllUsers() {
    return this.userModel.find().select('-password');
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.userModel.updateOne({ _id: userId }, { refreshToken });
  }

  async removeRefreshToken(userId: string) {
    await this.userModel.updateOne({ _id: userId }, { refreshToken: null });
  }
}
