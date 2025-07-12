import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UserController } from './user.controller';
import { JwtAuthGuard } from './guards/JwtAuth.guard';
import { Request } from 'express';

describe('UserController', () => {
  let controller: UserController;
  let jwtAuthGuard: JwtAuthGuard;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    roles: ['USER'],
    isActive: true,
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(),
    handleRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when user is present in request', () => {
      const mockRequest: Request = {
        user: mockUser,
      } as any;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toEqual(mockUser);
      expect(result).toBe(mockUser);
    });

    it('should return empty object when user is not present in request', () => {
      const mockRequest = {} as Request;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toEqual({});
    });

    it('should return empty object when user is null', () => {
      const mockRequest: Request = {
        user: null,
      } as any;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toEqual({});
    });

    it('should return empty object when user is undefined', () => {
      const mockRequest: Request = {
        user: undefined,
      } as any;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toEqual({});
    });

    it('should handle partial user object', () => {
      const partialUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };

      const mockRequest: Request = {
        user: partialUser,
      } as any;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toEqual(partialUser);
    });

    it('should handle empty user object', () => {
      const emptyUser = {};

      const mockRequest: Request = {
        user: emptyUser,
      } as any;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toEqual(emptyUser);
    });
  });

  describe('Controller', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have JwtAuthGuard defined', () => {
      expect(jwtAuthGuard).toBeDefined();
    });
  });

  describe('Request Object Handling', () => {
    it('should handle request with additional properties', () => {
      const mockRequest: Request = {
        user: mockUser,
        headers: {
          authorization: 'Bearer token123',
        },
        body: {},
        params: {},
        query: {},
      } as any;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toEqual(mockUser);
    });

    it('should not modify the original request object', () => {
      const originalRequest = {
        user: mockUser,
        headers: {
          authorization: 'Bearer token123',
        },
      } as any;

      const mockRequest: Request = { ...originalRequest };

      controller.getCurrentUser(mockRequest);

      expect(mockRequest).toEqual(originalRequest);
    });

    it('should handle request with falsy user values', () => {
      const testCases = [
        { user: false, expected: false },
        { user: 0, expected: 0 },
        { user: '', expected: '' },
        { user: NaN, expected: NaN },
      ];

      testCases.forEach((testCase) => {
        const mockRequest: Request = { user: testCase.user } as any;
        const result = controller.getCurrentUser(mockRequest);
        if (Number.isNaN(testCase.expected)) {
          expect(Number.isNaN(result)).toBe(true);
        } else {
          expect(result).toBe(testCase.expected);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should not throw errors for valid request objects', () => {
      const validRequests: Request[] = [
        { user: mockUser } as any,
        { user: null } as any,
        { user: undefined } as any,
        {} as any,
      ];

      validRequests.forEach((req: Request) => {
        expect(() => controller.getCurrentUser(req)).not.toThrow();
      });
    });

    it('should handle request with circular references in user object', () => {
      const circularUser: any = { id: '123', email: 'test@example.com' };
      circularUser.self = circularUser;

      const mockRequest: Request = {
        user: circularUser,
      } as any;

      const result = controller.getCurrentUser(mockRequest);

      expect(result).toBe(circularUser);
      expect((result as any).self).toBe(circularUser);
    });
  });

  describe('Type Safety', () => {
    it('should handle different types of user objects', () => {
      const userTypes: Request[] = [
        { user: { id: 1, name: 'John' } } as any, // number id
        { user: { id: '123', name: 'Jane' } } as any, // string id
        { user: { email: 'test@example.com' } } as any, // minimal user
        { user: { ...mockUser, additionalProp: 'value' } } as any, // extended user
      ];

      userTypes.forEach((testCase) => {
        const result = controller.getCurrentUser(testCase);
        expect(result).toEqual(testCase.user);
      });
    });
  });
});
