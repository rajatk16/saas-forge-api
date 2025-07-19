import { IsNotEmpty, IsString } from 'class-validator';

export class UserTenantDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;
}
