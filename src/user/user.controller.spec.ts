import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UserController } from './user.controller';
import { JwtAuthGuard } from './guards/JwtAuth.guard';
import { Request } from 'express';
import { UserService } from './user.service';

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

  const mockUserService = {
    getAllUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
        {
          provide: UserService,
          useValue: mockUserService,
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

  describe('getAllUsers', () => {
    const mockUsers = [
      {
        id: '507f1f77bcf86cd799439011',
        email: 'user1@example.com',
        roles: ['USER'],
        isActive: true,
      },
      {
        id: '507f1f77bcf86cd799439012',
        email: 'user2@example.com',
        roles: ['USER'],
        isActive: true,
      },
      {
        id: '507f1f77bcf86cd799439013',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        isActive: true,
      },
    ];

    it('should return all users when service returns users successfully', async () => {
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(mockUserService.getAllUsers).toHaveBeenCalledWith();
    });

    it('should return empty array when service returns empty array', async () => {
      mockUserService.getAllUsers.mockResolvedValue([]);

      const result = await controller.getAllUsers();

      expect(result).toEqual([]);
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(mockUserService.getAllUsers).toHaveBeenCalledWith();
    });

    it('should return single user when service returns only one user', async () => {
      const singleUser = [mockUsers[0]];
      mockUserService.getAllUsers.mockResolvedValue(singleUser);

      const result = await controller.getAllUsers();

      expect(result).toEqual(singleUser);
      expect(result).toHaveLength(1);
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should propagate error when service throws error', async () => {
      const errorMessage = 'Database connection failed';
      mockUserService.getAllUsers.mockRejectedValue(new Error(errorMessage));

      await expect(controller.getAllUsers()).rejects.toThrow(errorMessage);
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle service returning null', async () => {
      mockUserService.getAllUsers.mockResolvedValue(null);

      const result = await controller.getAllUsers();

      expect(result).toBeNull();
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle service returning undefined', async () => {
      mockUserService.getAllUsers.mockResolvedValue(undefined);

      const result = await controller.getAllUsers();

      expect(result).toBeUndefined();
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should verify that getAllUsers is async', async () => {
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      const result = controller.getAllUsers();

      expect(result).toBeInstanceOf(Promise);

      const resolvedResult = await result;
      expect(resolvedResult).toEqual(mockUsers);
    });

    it('should handle large dataset', async () => {
      const largeUserSet = Array.from({ length: 1000 }, (_, index) => ({
        id: `507f1f77bcf86cd79943${index.toString().padStart(4, '0')}`,
        email: `user${index}@example.com`,
        roles: ['USER'],
        isActive: true,
      }));

      mockUserService.getAllUsers.mockResolvedValue(largeUserSet);

      const result = await controller.getAllUsers();

      expect(result).toEqual(largeUserSet);
      expect(result).toHaveLength(1000);
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should handle different user role combinations', async () => {
      const diverseUsers = [
        { id: '1', email: 'user@example.com', roles: ['USER'], isActive: true },
        { id: '2', email: 'admin@example.com', roles: ['ADMIN'], isActive: true },
        { id: '3', email: 'superadmin@example.com', roles: ['ADMIN', 'SUPER_ADMIN'], isActive: true },
        { id: '4', email: 'inactive@example.com', roles: ['USER'], isActive: false },
      ];

      mockUserService.getAllUsers.mockResolvedValue(diverseUsers);

      const result = await controller.getAllUsers();

      expect(result).toEqual(diverseUsers);
      expect(result).toHaveLength(4);
      expect(mockUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should not modify returned data from service', async () => {
      const originalUsers = [...mockUsers];
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers();

      expect(result).toEqual(originalUsers);
      expect(mockUsers).toEqual(originalUsers); // Ensure original wasn't modified
    });
  });
});
