import { Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  id: false,
  _id: false,
})
export class TenantJoinRequest {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ default: Date.now, required: false })
  requestAt?: Date;
}

export const TenantJoinRequestSchema = SchemaFactory.createForClass(TenantJoinRequest);
