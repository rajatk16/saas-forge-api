import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'salt.hashedpassword',
    roles: ['USER'],
    isActive: true,
  };

  const mockUserResponse = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    roles: ['USER'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUserResponse);

      const result = await service.register(email, password);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserService.create).toHaveBeenCalledWith(email, expect.any(String));
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw ConflictException when user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(email, password)).rejects.toThrow(ConflictException);
      await expect(service.register(email, password)).rejects.toThrow(`User with email ${email} already exists`);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it('should handle userService.create failure', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockRejectedValue(new Error('Database error'));

      await expect(service.register(email, password)).rejects.toThrow('Database error');
    });

    it('should handle userService.findByEmail failure', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.register(email, password)).rejects.toThrow('Database connection failed');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const userWithPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      mockUserService.findByEmail.mockResolvedValue(userWithPassword);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(email, password);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email, true);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        {
          sub: userWithPassword._id,
          email: userWithPassword.email,
          roles: userWithPassword.roles,
          isActive: userWithPassword.isActive,
        },
        { expiresIn: '1h' },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: userWithPassword._id,
          email: userWithPassword.email,
          roles: userWithPassword.roles,
          isActive: userWithPassword.isActive,
        },
        { expiresIn: '7d', secret: undefined },
      );
      expect(result).toEqual({
        accessToken: 'jwt-token-123',
        refreshToken: 'jwt-token-123',
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(email, password)).rejects.toThrow('Invalid credentials');

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email, true);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      const userWithPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      mockUserService.findByEmail.mockResolvedValue(userWithPassword);

      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(email, password)).rejects.toThrow('Invalid credentials');

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email, true);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle malformed password hash', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const userWithMalformedPassword = {
        ...mockUser,
        password: 'invalid-hash-format',
      };

      mockUserService.findByEmail.mockResolvedValue(userWithMalformedPassword);

      await expect(service.login(email, password)).rejects.toThrow();
    });

    it('should handle userService.findByEmail failure during login', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(service.login(email, password)).rejects.toThrow('Database error');
    });

    it('should handle JWT signing failure', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const userWithPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      mockUserService.findByEmail.mockResolvedValue(userWithPassword);
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.login(email, password)).rejects.toThrow('JWT signing failed');
    });
  });

  describe('password hashing', () => {
    it('should generate different hashes for same password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUserResponse);

      await service.register(email, password);
      await service.register('another@example.com', password);

      const firstCall = mockUserService.create.mock.calls[0][1];
      const secondCall = mockUserService.create.mock.calls[1][1];

      expect(firstCall).not.toBe(secondCall);
      expect(firstCall.split('.')[0]).not.toBe(secondCall.split('.')[0]); // Different salts
    });
  });

  describe('service instance', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have userService and jwtService injected', () => {
      expect(service['userService']).toBeDefined();
      expect(service['jwtService']).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email and password', async () => {
      const email = '';
      const password = '';

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUserResponse);

      await service.register(email, password);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserService.create).toHaveBeenCalledWith(email, expect.any(String));
    });

    it('should handle very long password', async () => {
      const email = 'test@example.com';
      const password = 'a'.repeat(1000);

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUserResponse);

      await service.register(email, password);

      expect(mockUserService.create).toHaveBeenCalledWith(email, expect.any(String));
    });

    it('should handle special characters in password', async () => {
      const email = 'test@example.com';
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUserResponse);

      await service.register(email, password);

      expect(mockUserService.create).toHaveBeenCalledWith(email, expect.any(String));
    });
  });
});
