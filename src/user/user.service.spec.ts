import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { UserResponseDto } from './dtos/UserResponse.dto';

describe('UserService', () => {
  let service: UserService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword123',
    roles: ['USER'],
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockSavedUser = {
        ...mockUser,
        email,
        password,
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedUser);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      // Mock the constructor call
      (mockUserModel as any).constructor = mockConstructor;
      service['userModel'] = mockConstructor as any;

      const result = await service.create(email, password);

      expect(mockConstructor).toHaveBeenCalledWith({ email, password });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.email).toBe(email);
      expect(result._id).toBe(mockSavedUser._id);
      expect(result.roles).toEqual(mockSavedUser.roles);
      expect(result.isActive).toBe(mockSavedUser.isActive);
      expect(result.createdAt).toEqual(mockSavedUser.createdAt);
      expect(result.updatedAt).toEqual(mockSavedUser.updatedAt);
      expect(result.password).toBeUndefined(); // Should be excluded
    });

    it('should handle database errors during user creation', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const error = new Error('Database error');

      const mockSave = jest.fn().mockRejectedValue(error);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service['userModel'] = mockConstructor as any;

      await expect(service.create(email, password)).rejects.toThrow('Database error');
    });

    it('should handle duplicate email error', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const duplicateError = new Error('Duplicate key error');
      duplicateError.name = 'MongoError';
      (duplicateError as any).code = 11000;

      const mockSave = jest.fn().mockRejectedValue(duplicateError);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service['userModel'] = mockConstructor as any;

      await expect(service.create(email, password)).rejects.toThrow('Duplicate key error');
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email without password', async () => {
      const email = 'test@example.com';
      const mockFoundUser = {
        ...mockUser,
        email,
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockFoundUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockQuery.select).toHaveBeenCalledWith('');
      expect(result).toEqual(mockFoundUser);
    });

    it('should find a user by email with password when includePassword is true', async () => {
      const email = 'test@example.com';
      const mockFoundUser = {
        ...mockUser,
        email,
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockFoundUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findByEmail(email, true);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockQuery.select).toHaveBeenCalledWith('+password');
      expect(result).toEqual(mockFoundUser);
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';

      const mockQuery = {
        select: jest.fn().mockResolvedValue(null),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockQuery.select).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should handle database errors during user lookup', async () => {
      const email = 'test@example.com';
      const error = new Error('Database connection error');

      const mockQuery = {
        select: jest.fn().mockRejectedValue(error),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      await expect(service.findByEmail(email)).rejects.toThrow('Database connection error');
    });

    it('should use default value for includePassword parameter', async () => {
      const email = 'test@example.com';
      const mockFoundUser = {
        ...mockUser,
        email,
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockFoundUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      await service.findByEmail(email);

      expect(mockQuery.select).toHaveBeenCalledWith('');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string email', async () => {
      const email = '';
      const password = 'password123';

      const mockSavedUser = {
        ...mockUser,
        email,
        password,
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedUser);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service['userModel'] = mockConstructor as any;

      const result = await service.create(email, password);

      expect(mockConstructor).toHaveBeenCalledWith({ email, password });
      expect(result.email).toBe(email);
    });

    it('should handle empty string password', async () => {
      const email = 'test@example.com';
      const password = '';

      const mockSavedUser = {
        ...mockUser,
        email,
        password,
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedUser);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      service['userModel'] = mockConstructor as any;

      const result = await service.create(email, password);

      expect(mockConstructor).toHaveBeenCalledWith({ email, password });
      expect(result.email).toBe(email);
    });

    it('should handle special characters in email', async () => {
      const email = 'test+special@example.com';
      const mockFoundUser = {
        ...mockUser,
        email,
      };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockFoundUser),
      };

      mockUserModel.findOne = jest.fn().mockReturnValue(mockQuery);

      const result = await service.findByEmail(email);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockFoundUser);
    });
  });

  describe('getAllUsers', () => {
    const mockUsers = [
      {
        _id: '507f1f77bcf86cd799439011',
        email: 'user1@example.com',
        roles: ['USER'],
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      {
        _id: '507f1f77bcf86cd799439012',
        email: 'user2@example.com',
        roles: ['USER'],
        isActive: true,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
      },
      {
        _id: '507f1f77bcf86cd799439013',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        isActive: true,
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03'),
      },
    ];

    beforeEach(() => {
      // Reset the mock before each test
      jest.clearAllMocks();
    });

    it('should return all users without passwords', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUsers),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no users exist', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue([]),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle database errors during user retrieval', async () => {
      const error = new Error('Database connection failed');
      const mockQuery = {
        select: jest.fn().mockRejectedValue(error),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      await expect(service.getAllUsers()).rejects.toThrow('Database connection failed');
      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
    });

    it('should return single user when only one user exists', async () => {
      const singleUser = [mockUsers[0]];
      const mockQuery = {
        select: jest.fn().mockResolvedValue(singleUser),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(singleUser);
      expect(result).toHaveLength(1);
    });

    it('should handle users with different roles', async () => {
      const diverseUsers = [
        {
          _id: '507f1f77bcf86cd799439014',
          email: 'user@example.com',
          roles: ['USER'],
          isActive: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          _id: '507f1f77bcf86cd799439015',
          email: 'admin@example.com',
          roles: ['ADMIN'],
          isActive: true,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
        {
          _id: '507f1f77bcf86cd799439016',
          email: 'superadmin@example.com',
          roles: ['ADMIN', 'SUPER_ADMIN'],
          isActive: true,
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03'),
        },
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue(diverseUsers),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(diverseUsers);
      expect(result).toHaveLength(3);
    });

    it('should handle inactive users', async () => {
      const usersWithInactive = [
        {
          _id: '507f1f77bcf86cd799439017',
          email: 'active@example.com',
          roles: ['USER'],
          isActive: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          _id: '507f1f77bcf86cd799439018',
          email: 'inactive@example.com',
          roles: ['USER'],
          isActive: false,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue(usersWithInactive),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(usersWithInactive);
      expect(result).toHaveLength(2);
    });

    it('should handle large datasets', async () => {
      const largeUserSet = Array.from({ length: 1000 }, (_, index) => ({
        _id: `507f1f77bcf86cd79943${index.toString().padStart(4, '0')}`,
        email: `user${index}@example.com`,
        roles: ['USER'],
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      }));

      const mockQuery = {
        select: jest.fn().mockResolvedValue(largeUserSet),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(largeUserSet);
      expect(result).toHaveLength(1000);
    });

    it('should verify method returns a promise', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUsers),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = service.getAllUsers();

      expect(result).toBeInstanceOf(Promise);

      const resolvedResult = await result;
      expect(resolvedResult).toEqual(mockUsers);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'MongoNetworkTimeoutError';

      const mockQuery = {
        select: jest.fn().mockRejectedValue(timeoutError),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      await expect(service.getAllUsers()).rejects.toThrow('Network timeout');
      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
    });

    it('should exclude password field from all returned users', async () => {
      // Mock should return users without passwords (simulating Mongoose select behavior)
      const usersWithoutPasswords = [
        {
          _id: '507f1f77bcf86cd799439019',
          email: 'user1@example.com',
          roles: ['USER'],
          isActive: true,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          _id: '507f1f77bcf86cd799439020',
          email: 'user2@example.com',
          roles: ['USER'],
          isActive: true,
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue(usersWithoutPasswords),
      };

      mockUserModel.find = jest.fn().mockReturnValue(mockQuery);

      const result = await service.getAllUsers();

      expect(mockUserModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(usersWithoutPasswords);

      // Verify no password field is present in any user
      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });
});
