import { IsNotEmpty, IsString } from 'class-validator';

export class TenantNameDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
