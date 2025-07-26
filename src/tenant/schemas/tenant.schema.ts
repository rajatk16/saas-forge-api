import { Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { TenantMember, TenantMemberSchema } from './tenantMember.schema';
import { TenantJoinRequest, TenantJoinRequestSchema } from './tenantJoinRequest.schema';

@Schema({
  timestamps: true,
})
export class Tenant {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  updatedBy: string;

  @Prop({ required: true, type: [TenantMemberSchema], default: [] })
  members: TenantMember[];

  @Prop({ type: [TenantJoinRequestSchema], default: [] })
  joinRequests: TenantJoinRequest[];
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
