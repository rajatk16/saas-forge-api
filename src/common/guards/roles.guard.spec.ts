import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    roles: ['USER'],
    isActive: true,
  };

  const mockAdminUser = {
    id: '507f1f77bcf86cd799439012',
    email: 'admin@example.com',
    roles: ['ADMIN'],
    isActive: true,
  };

  const mockMultiRoleUser = {
    id: '507f1f77bcf86cd799439013',
    email: 'manager@example.com',
    roles: ['USER', 'MANAGER'],
    isActive: true,
  };

  const mockGetRequest = jest.fn();
  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: mockGetRequest,
    })),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      const requiredRoles = ['USER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockUser,
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when user has multiple roles and one matches', () => {
      const requiredRoles = ['MANAGER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockMultiRoleUser,
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when user has at least one of multiple required roles', () => {
      const requiredRoles = ['ADMIN', 'MANAGER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockMultiRoleUser,
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      const requiredRoles = ['ADMIN'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockUser,
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'You do not have permission to access this resource',
      );
    });

    it('should throw ForbiddenException when user is not present', () => {
      const requiredRoles = ['USER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({});

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'You do not have permission to access this resource',
      );
    });

    it('should throw ForbiddenException when user is null', () => {
      const requiredRoles = ['USER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: null,
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'You do not have permission to access this resource',
      );
    });

    it('should throw ForbiddenException when user has no roles', () => {
      const requiredRoles = ['USER'];
      const userWithoutRoles = { ...mockUser, roles: [] };
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: userWithoutRoles,
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'You do not have permission to access this resource',
      );
    });

    it('should throw ForbiddenException when user roles is null', () => {
      const requiredRoles = ['USER'];
      const userWithNullRoles = { ...mockUser, roles: null };
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: userWithNullRoles,
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'You do not have permission to access this resource',
      );
    });

    it('should throw ForbiddenException when user roles is undefined', () => {
      const requiredRoles = ['USER'];
      const userWithUndefinedRoles = { ...mockUser, roles: undefined };
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: userWithUndefinedRoles,
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'You do not have permission to access this resource',
      );
    });

    it('should handle case-sensitive role matching', () => {
      const requiredRoles = ['admin'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockAdminUser, // has 'ADMIN' role
      });

      // ADMIN users now bypass all role restrictions
      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should handle empty required roles array', () => {
      const requiredRoles = [];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockUser, // USER role, not ADMIN
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'You do not have permission to access this resource',
      );
    });

    it('should handle undefined required roles', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow ADMIN users to bypass all role restrictions', () => {
      const requiredRoles = ['MANAGER', 'SUPERVISOR'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockAdminUser, // has 'ADMIN' role
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow ADMIN users even when they do not have the specific required role', () => {
      const requiredRoles = ['SUPER_USER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: mockAdminUser, // has 'ADMIN' role, not 'SUPER_USER'
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow users with ADMIN role among multiple roles', () => {
      const userWithAdminRole = {
        id: '507f1f77bcf86cd799439014',
        email: 'superuser@example.com',
        roles: ['USER', 'ADMIN', 'MANAGER'],
        isActive: true,
      };

      const requiredRoles = ['SUPERVISOR'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: userWithAdminRole,
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('guard instance', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should have reflector injected', () => {
      expect(reflector).toBeDefined();
    });

    it('should have canActivate method', () => {
      expect(typeof guard.canActivate).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle complex user objects', () => {
      const complexUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        roles: ['USER'],
        permissions: ['READ', 'WRITE'],
        metadata: {
          lastLogin: new Date(),
          createdAt: new Date(),
        },
      };

      const requiredRoles = ['USER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: complexUser,
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle non-string roles', () => {
      const userWithNonStringRoles = {
        ...mockUser,
        roles: [123, 'USER', null, undefined],
      };

      const requiredRoles = ['USER'];
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
      mockGetRequest.mockReturnValue({
        user: userWithNonStringRoles,
      });

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
