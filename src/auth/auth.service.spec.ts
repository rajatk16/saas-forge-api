import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

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
  };

  const mockJwtService = {
    sign: jest.fn(),
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

      // Verify password was hashed
      const createCall = mockUserService.create.mock.calls[0];
      const hashedPassword = createCall[1];
      expect(hashedPassword).toContain('.');
      expect(hashedPassword.split('.').length).toBe(2);
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
      const salt = randomBytes(8).toString('hex');
      const hash = (await scrypt(password, salt, 32)) as Buffer;
      const hashedPassword = `${salt}.${hash.toString('hex')}`;

      const userWithPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      mockUserService.findByEmail.mockResolvedValue(userWithPassword);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(email, password);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email, true);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: userWithPassword._id,
        email: userWithPassword.email,
        roles: userWithPassword.roles,
        isActive: userWithPassword.isActive,
      });
      expect(result).toEqual({ accessToken: 'jwt-token-123' });
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
      const salt = randomBytes(8).toString('hex');
      const hash = (await scrypt('correctpassword', salt, 32)) as Buffer;
      const hashedPassword = `${salt}.${hash.toString('hex')}`;

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
      const salt = randomBytes(8).toString('hex');
      const hash = (await scrypt(password, salt, 32)) as Buffer;
      const hashedPassword = `${salt}.${hash.toString('hex')}`;

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

    it('should create hash with correct format', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUserResponse);

      await service.register(email, password);

      const hashedPassword = mockUserService.create.mock.calls[0][1];
      const parts = hashedPassword.split('.');

      expect(parts.length).toBe(2);
      expect(parts[0].length).toBe(16); // Salt length
      expect(parts[1].length).toBe(64); // Hash length (32 bytes * 2 hex chars)
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
