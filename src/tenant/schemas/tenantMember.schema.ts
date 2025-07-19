import { Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class TenantMember {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true, enum: ['ADMIN', 'VIEWER', 'EDITOR', 'OWNER'], default: 'VIEWER' })
  role: string;
}

export const TenantMemberSchema = SchemaFactory.createForClass(TenantMember);
