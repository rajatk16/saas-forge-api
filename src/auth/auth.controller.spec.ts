import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { RegisterUserDto } from './dtos/RegisterUser.dto';
import { RefreshTokenDto } from './dtos/RefreshToken.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthController', () => {
  let controller: AuthController;

  const mockUserResponse = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    roles: ['USER'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    generateTokens: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockUserService = {
    findByEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle registration errors', async () => {
      const registerDto: RegisterUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new Error('User already exists');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow('User already exists');
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
    });

    it('should handle empty email', async () => {
      const registerDto: RegisterUserDto = {
        email: '',
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith('', 'password123');
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle empty password', async () => {
      const registerDto: RegisterUserDto = {
        email: 'test@example.com',
        password: '',
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith('test@example.com', '');
      expect(result).toEqual(mockUserResponse);
    });

    it('should handle special characters in email and password', async () => {
      const registerDto: RegisterUserDto = {
        email: 'test+special@example.com',
        password: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockLoginResponse = {
        accessToken: 'jwt-token-123',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle login errors', async () => {
      const loginDto: RegisterUserDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('should handle empty email and password', async () => {
      const loginDto: RegisterUserDto = {
        email: '',
        password: '',
      };

      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(mockAuthService.login).toHaveBeenCalledWith('', '');
    });

    it('should handle special characters in credentials', async () => {
      const loginDto: RegisterUserDto = {
        email: 'test+special@example.com',
        password: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      };

      const mockLoginResponse = {
        accessToken: 'jwt-token-special-123',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle authService throwing unexpected error', async () => {
      const loginDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const error = new Error('Database connection failed');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Database connection failed');
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });

  describe('refresh', () => {
    const mockRefreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockJwtPayload = {
      email: 'test@example.com',
      sub: '507f1f77bcf86cd799439011',
    };

    const mockUserWithRefreshToken = {
      ...mockUserResponse,
      id: '507f1f77bcf86cd799439011',
      refreshToken: 'hashed-refresh-token',
    };

    const mockTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('refresh-secret');
      mockAuthService.generateTokens.mockReturnValue(mockTokens);
      mockAuthService.updateRefreshToken.mockResolvedValue(undefined);
    });

    it('should successfully refresh tokens with valid refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockUserService.findByEmail.mockResolvedValue(mockUserWithRefreshToken);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await controller.refresh(mockRefreshTokenDto);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('valid-refresh-token', 'hashed-refresh-token');
      expect(mockAuthService.generateTokens).toHaveBeenCalledWith(mockUserWithRefreshToken);
      expect(mockAuthService.updateRefreshToken).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'new-refresh-token');
      expect(result).toEqual(mockTokens);
    });

    it('should throw ForbiddenException when JWT verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).not.toHaveBeenCalled();
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has no refresh token', async () => {
      const userWithoutRefreshToken = {
        ...mockUserResponse,
        id: '507f1f77bcf86cd799439011',
        refreshToken: null,
      };

      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockUserService.findByEmail.mockResolvedValue(userWithoutRefreshToken);

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when refresh token does not match', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockUserService.findByEmail.mockResolvedValue(mockUserWithRefreshToken);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('valid-refresh-token', 'hashed-refresh-token');
      expect(mockAuthService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when bcrypt compare throws an error', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockUserService.findByEmail.mockResolvedValue(mockUserWithRefreshToken);
      mockedBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('valid-refresh-token', 'hashed-refresh-token');
    });

    it('should throw ForbiddenException when user service throws an error', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockUserService.findByEmail.mockRejectedValue(new Error('Database error'));

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when updateRefreshToken fails', async () => {
      mockJwtService.verifyAsync.mockResolvedValue(mockJwtPayload);
      mockUserService.findByEmail.mockResolvedValue(mockUserWithRefreshToken);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockAuthService.updateRefreshToken.mockRejectedValue(new Error('Update failed'));

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('valid-refresh-token', 'hashed-refresh-token');
      expect(mockAuthService.generateTokens).toHaveBeenCalledWith(mockUserWithRefreshToken);
      expect(mockAuthService.updateRefreshToken).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'new-refresh-token');
    });

    it('should handle empty refresh token', async () => {
      const emptyRefreshTokenDto: RefreshTokenDto = {
        refreshToken: '',
      };

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(controller.refresh(emptyRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('', {
        secret: 'refresh-secret',
      });
    });

    it('should handle JWT payload without email', async () => {
      const payloadWithoutEmail = {
        sub: '507f1f77bcf86cd799439011',
      };

      mockJwtService.verifyAsync.mockResolvedValue(payloadWithoutEmail);
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(controller.refresh(mockRefreshTokenDto)).rejects.toThrow(
        new ForbiddenException('Token expired or invalid.'),
      );

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(undefined);
    });
  });
});
