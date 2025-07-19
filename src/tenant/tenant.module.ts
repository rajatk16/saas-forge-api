import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { Tenant, TenantSchema } from './schemas/tenant.schema';

@Module({
  controllers: [TenantController],
  providers: [TenantService],
  imports: [MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }])],
})
export class TenantModule {}
