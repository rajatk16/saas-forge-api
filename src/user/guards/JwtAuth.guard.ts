import { AuthGuard } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * @param err - The error object
   * @param user - The user object
   * @param info - The info object
   * @returns The user object
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const exceptionMessage =
        info?.name === 'TokenExpiredError' ? 'Token expired' : info?.message ? info.message : 'Invalid token';
      throw new UnauthorizedException(exceptionMessage);
    }
    return user;
  }
}
