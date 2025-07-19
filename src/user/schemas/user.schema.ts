import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserTenant, UserTenantSchema } from './userTenant.schema';

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  refreshToken?: string;

  @Prop({ type: [UserTenantSchema], default: [] })
  tenants: UserTenant[];
}

export const UserSchema = SchemaFactory.createForClass(User);
