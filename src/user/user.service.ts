import { Model, Types } from 'mongoose';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';

import { User } from './schemas/user.schema';
import { UserResponseDto } from './dtos/UserResponse.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(email: string, password: string): Promise<UserResponseDto> {
    const user = new this.userModel({ email, password });
    const savedUser = await user.save();

    return plainToInstance(UserResponseDto, savedUser, { excludeExtraneousValues: true });
  }

  async getAllUsers() {
    return this.userModel.find().select('-password');
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password');
  }

  async findByEmail(email: string, includePassword: boolean = false) {
    return this.userModel.findOne({ email }).select(`${includePassword ? '+' : '-'}password`);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }

  async removeRefreshToken(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null }, { new: true });
  }

  async deactivateUser(id: string) {
    return this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async activateUser(id: string) {
    return this.userModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
  }

  async addTenantToUser(userId: string, tenantId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.tenants.push({
      tenantId: new Types.ObjectId(tenantId),
      default: user.tenants.length === 0,
    });

    await user.save();

    return user;
  }

  async removeTenantFromUser(userId: string, tenantId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenants.length === 1) {
      throw new BadRequestException('User must have at least one tenant');
    }

    user.tenants = user.tenants.filter((tenant) => tenant.tenantId.toString() !== tenantId);

    await user.save();

    return user;
  }

  async setDefaultTenant(userId: string, tenantId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.tenants = user.tenants.map((tenant) => ({
      ...tenant,
      default: tenant.tenantId.toString() === tenantId,
    }));

    await user.save();

    return user;
  }
}
