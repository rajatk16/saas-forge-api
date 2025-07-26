import { Model } from 'mongoose';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { Tenant } from './schemas/tenant.schema';
import { UserService } from '../user/user.service';
import { TenantRole } from '../common/enums/TenantRole.enum';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    private readonly userService: UserService,
  ) {}

  async createTenant(user: Request['user'], name: string) {
    const tenant = await this.tenantModel.create({
      name,
      createdBy: user.userId,
      updatedBy: user.userId,
      members: [
        {
          userId: user.userId,
          role: TenantRole.OWNER,
        },
      ],
    });

    return tenant;
  }

  async getAllTenants() {
    return this.tenantModel.find();
  }

  async getTenant(id: string) {
    return this.tenantModel.findById(id);
  }

  async updateTenant(id: string, name: string) {
    return this.tenantModel.findByIdAndUpdate(id, { name }, { new: true });
  }

  async deleteTenant(id: string) {
    return this.tenantModel.findByIdAndDelete(id);
  }

  async addUserToTenant(tenantId: string, userId: string, role: TenantRole) {
    return this.tenantModel.findByIdAndUpdate(tenantId, { $push: { members: { userId, role } } }, { new: true });
  }

  async removeUserFromTenant(tenantId: string, userId: string) {
    return this.tenantModel.findByIdAndUpdate(tenantId, { $pull: { members: { userId } } }, { new: true });
  }

  async requestToJoinTenant(userId: string, tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existingRequest = tenant.joinRequests.find((request) => request.userId.toString() === userId);
    if (existingRequest) {
      throw new BadRequestException('You have already requested to join this tenant');
    }

    const existingMember = tenant.members.find((member) => member.userId.toString() === userId);
    if (existingMember) {
      throw new BadRequestException('You are already a member of this tenant');
    }

    tenant.joinRequests.push({ userId });
    await tenant.save();

    return tenant;
  }

  async respondToJoinRequest(tenantId: string, userId: string, approval: boolean) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const request = tenant.joinRequests.find((r) => r.userId.toString() === userId);
    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    if (approval) {
      tenant.members.push({ userId: request.userId, role: TenantRole.VIEWER });
      await this.userService.addTenantToUser(request.userId, tenantId);
    }

    tenant.joinRequests = tenant.joinRequests.filter((r) => r.userId.toString() !== userId);
    await tenant.save();

    return tenant;
  }
}
