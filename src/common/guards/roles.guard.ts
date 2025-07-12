import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    // Allow access if user has ADMIN role
    if (user && user.roles?.includes('ADMIN')) {
      return true;
    }

    if (!user || !user.roles?.some((r: string) => requiredRoles.includes(r))) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    return true;
  }
}
