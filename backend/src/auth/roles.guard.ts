import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../common/errors/app-exceptions.js';
import { ErrorCode } from '../common/errors/error-codes.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as { role?: Role } | undefined;
    if (!user?.role) {
      throw new UnauthorizedError(ErrorCode.UNAUTHENTICATED, 'Authentication required');
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.warn(
        `Denied: ${context.getClass().name}.${context.getHandler().name} declares no @Roles()`,
      );
      throw new ForbiddenError(ErrorCode.FORBIDDEN, 'Access to this resource is not permitted');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenError(
        ErrorCode.INSUFFICIENT_ROLE,
        'Your role is not allowed to perform this action',
      );
    }
    return true;
  }
}
