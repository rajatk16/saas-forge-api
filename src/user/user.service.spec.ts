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
});
