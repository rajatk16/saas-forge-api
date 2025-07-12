import { Exclude, Expose } from 'class-transformer';

@Expose()
export class UserResponseDto {
  @Expose() readonly _id: string;

  @Expose() readonly email: string;

  @Expose() readonly roles: string[];

  @Expose() readonly isActive: boolean;

  @Expose() readonly createdAt: Date;

  @Expose() readonly updatedAt: Date;

  @Exclude() readonly password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
