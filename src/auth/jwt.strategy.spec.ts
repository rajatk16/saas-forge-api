import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-jwt-secret-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should transform JWT payload to user object', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['USER'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        isActive: payload.isActive,
      });
    });

    it('should handle payload with multiple roles', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        roles: ['USER', 'ADMIN', 'MODERATOR'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        isActive: payload.isActive,
      });
    });

    it('should handle payload with inactive user', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'inactive@example.com',
        roles: ['USER'],
        isActive: false,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        isActive: false,
      });
    });

    it('should handle payload with empty roles array', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: [],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: [],
        isActive: payload.isActive,
      });
    });

    it('should handle payload with special characters in email', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test+special@example.com',
        roles: ['USER'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        isActive: payload.isActive,
      });
    });

    it('should handle payload with numeric user ID', () => {
      const payload = {
        sub: '123456789',
        email: 'test@example.com',
        roles: ['USER'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: '123456789',
        email: payload.email,
        roles: payload.roles,
        isActive: payload.isActive,
      });
    });

    it('should handle payload with custom roles', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['CUSTOM_ROLE', 'ANOTHER_ROLE'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        isActive: payload.isActive,
      });
    });

    it('should maintain object reference integrity', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['USER'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result.userId).toBe(payload.sub);
      expect(result.email).toBe(payload.email);
      expect(result.roles).toBe(payload.roles);
      expect(result.isActive).toBe(payload.isActive);
    });

    it('should handle payload with all supported data types', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: ['USER', 'ADMIN'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(typeof result.userId).toBe('string');
      expect(typeof result.email).toBe('string');
      expect(Array.isArray(result.roles)).toBe(true);
      expect(typeof result.isActive).toBe('boolean');
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should have validate method', () => {
      expect(typeof strategy.validate).toBe('function');
    });

    it('should call configService.getOrThrow during initialization', () => {
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('error handling', () => {
    it('should handle payload with missing properties gracefully', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        // Missing roles and isActive
      } as any;

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: undefined,
        isActive: undefined,
      });
    });

    it('should handle payload with null values', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: null,
        isActive: null,
      } as any;

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: null,
        isActive: null,
      });
    });

    it('should handle payload with undefined values', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: undefined,
        isActive: undefined,
      } as any;

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: undefined,
        isActive: undefined,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const payload = {
        sub: '',
        email: '',
        roles: [''],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: '',
        email: '',
        roles: [''],
        isActive: true,
      });
    });

    it('should handle very long values', () => {
      const longString = 'a'.repeat(1000);
      const payload = {
        sub: longString,
        email: longString + '@example.com',
        roles: [longString],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: longString,
        email: longString + '@example.com',
        roles: [longString],
        isActive: true,
      });
    });

    it('should handle unicode characters', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'tëst@exämple.com',
        roles: ['ÜSER'],
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        isActive: payload.isActive,
      });
    });

    it('should handle large arrays of roles', () => {
      const manyRoles = Array.from({ length: 100 }, (_, i) => `ROLE_${i}`);
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        roles: manyRoles,
        isActive: true,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        roles: manyRoles,
        isActive: payload.isActive,
      });
    });
  });
});
