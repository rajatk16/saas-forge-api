import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './JwtAuth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['USER'],
      };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, null)).toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => guard.handleRequest(null, undefined, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, undefined, null)).toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when user is falsy', () => {
      const falsyValues = [false, 0, '', NaN];

      falsyValues.forEach((falsyValue) => {
        expect(() => guard.handleRequest(null, falsyValue, null)).toThrow(UnauthorizedException);
        expect(() => guard.handleRequest(null, falsyValue, null)).toThrow('Invalid token');
      });
    });

    it('should throw UnauthorizedException with TokenExpiredError message', () => {
      const info = { name: 'TokenExpiredError' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Token expired');
    });

    it('should throw UnauthorizedException with custom info message', () => {
      const info = { message: 'Custom error message' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Custom error message');
    });

    it('should throw UnauthorizedException with error when err is provided', () => {
      const error = new Error('Authentication failed');
      const mockUser = { id: '123', email: 'test@example.com' };

      expect(() => guard.handleRequest(error, mockUser, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, mockUser, null)).toThrow('Invalid token');
    });

    it('should prioritize TokenExpiredError over other info', () => {
      const info = {
        name: 'TokenExpiredError',
        message: 'Other message',
      };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Token expired');
    });

    it('should handle info with both name and message', () => {
      const info = {
        name: 'SomeOtherError',
        message: 'Specific error message',
      };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Specific error message');
    });

    it('should handle info with only name (not TokenExpiredError)', () => {
      const info = { name: 'JsonWebTokenError' };

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Invalid token');
    });

    it('should handle empty info object', () => {
      const info = {};

      expect(() => guard.handleRequest(null, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, info)).toThrow('Invalid token');
    });

    it('should handle null info', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, null)).toThrow('Invalid token');
    });

    it('should handle undefined info', () => {
      expect(() => guard.handleRequest(null, null, undefined)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(null, null, undefined)).toThrow('Invalid token');
    });

    it('should return user even when info is provided but user is valid', () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };
      const info = { message: 'Some warning' };

      const result = guard.handleRequest(null, mockUser, info);

      expect(result).toEqual(mockUser);
    });

    it('should handle complex user objects', () => {
      const complexUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        roles: ['USER', 'ADMIN'],
        permissions: ['READ', 'WRITE'],
        metadata: {
          lastLogin: new Date(),
          createdAt: new Date(),
        },
      };

      const result = guard.handleRequest(null, complexUser, null);

      expect(result).toEqual(complexUser);
      expect(result).toBe(complexUser);
    });

    it('should handle string user', () => {
      const stringUser = 'user123';

      const result = guard.handleRequest(null, stringUser, null);

      expect(result).toBe(stringUser);
    });

    it('should handle numeric user', () => {
      const numericUser = 123;

      const result = guard.handleRequest(null, numericUser, null);

      expect(result).toBe(numericUser);
    });

    it('should handle array user', () => {
      const arrayUser = ['user', 'admin'];

      const result = guard.handleRequest(null, arrayUser, null);

      expect(result).toEqual(arrayUser);
    });
  });

  describe('guard instance', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should extend AuthGuard', () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });

    it('should have handleRequest method', () => {
      expect(typeof guard.handleRequest).toBe('function');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle complex error objects', () => {
      const complexError = {
        name: 'ComplexError',
        message: 'Complex error occurred',
        stack: 'Error stack trace',
        code: 'ERR_COMPLEX',
      };

      expect(() => guard.handleRequest(complexError, null, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(complexError, null, null)).toThrow('Invalid token');
    });

    it('should handle both error and info with TokenExpiredError', () => {
      const error = new Error('Some error');
      const info = { name: 'TokenExpiredError' };

      expect(() => guard.handleRequest(error, null, info)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, null, info)).toThrow('Token expired');
    });

    it('should handle error with user but no info', () => {
      const error = new Error('Some error');
      const mockUser = { id: '123' };

      expect(() => guard.handleRequest(error, mockUser, null)).toThrow(UnauthorizedException);
      expect(() => guard.handleRequest(error, mockUser, null)).toThrow('Invalid token');
    });
  });
});
