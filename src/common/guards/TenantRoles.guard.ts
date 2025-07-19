import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { TenantRole } from '../enums/TenantRole.enum';
import { TenantService } from '../../tenant/tenant.service';
import { TENANT_ROLES_KEY } from '../decorators/TenantRoles.decorator';

@Injectable()
export class TenantRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(TENANT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request: Request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) return false;

    const tenantId = request.params.id || (request.headers['x-tenant-id'] as string);
    if (!tenantId) return false;

    const tenant = await this.tenantService.getTenant(tenantId);
    if (!tenant) return false;

    const tenantRole = tenant.members.find((member) => member.userId === user.userId)?.role;

    if (!tenantRole) return false;

    return requiredRoles.includes(tenantRole as TenantRole);
  }
}
