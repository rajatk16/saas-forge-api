import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dtos/RegisterUser.dto';

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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

  describe('controller instance', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(controller['authService']).toBeDefined();
    });
  });

  describe('DTO handling', () => {
    it('should accept RegisterUserDto with exact interface', async () => {
      const registerDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
    });

    it('should handle RegisterUserDto with additional properties', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        additionalProperty: 'ignored',
      } as RegisterUserDto;

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
    });
  });

  describe('error propagation', () => {
    it('should propagate ConflictException from register', async () => {
      const registerDto: RegisterUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const conflictError = new Error('ConflictException: User already exists');
      conflictError.name = 'ConflictException';
      mockAuthService.register.mockRejectedValue(conflictError);

      await expect(controller.register(registerDto)).rejects.toThrow(conflictError);
    });

    it('should propagate UnauthorizedException from login', async () => {
      const loginDto: RegisterUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const unauthorizedError = new Error('UnauthorizedException: Invalid credentials');
      unauthorizedError.name = 'UnauthorizedException';
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto)).rejects.toThrow(unauthorizedError);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined DTO properties', async () => {
      const registerDto: RegisterUserDto = {
        email: null,
        password: undefined,
      } as any;

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(null, undefined);
    });

    it('should handle very long email and password', async () => {
      const registerDto: RegisterUserDto = {
        email: 'a'.repeat(100) + '@example.com',
        password: 'b'.repeat(200),
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
    });

    it('should handle unicode characters in email and password', async () => {
      const registerDto: RegisterUserDto = {
        email: 'tëst@exämple.com',
        password: 'pässwörd123',
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto.email, registerDto.password);
    });
  });
});
