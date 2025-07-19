import { Model } from 'mongoose';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Tenant } from './schemas/tenant.schema';
import { TenantRole } from '../common/enums/TenantRole.enum';

@Injectable()
export class TenantService {
  constructor(@InjectModel(Tenant.name) private tenantModel: Model<Tenant>) {}

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
}
