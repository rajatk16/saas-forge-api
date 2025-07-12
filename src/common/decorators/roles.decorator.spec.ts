import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from './roles.decorator';

// Mock SetMetadata since we need to test the decorator behavior
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

describe('RolesDecorator', () => {
  const mockSetMetadata = SetMetadata as jest.Mock;

  beforeEach(() => {
    mockSetMetadata.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ROLES_KEY constant', () => {
    it('should have the correct value', () => {
      expect(ROLES_KEY).toBe('roles');
    });

    it('should be a string', () => {
      expect(typeof ROLES_KEY).toBe('string');
    });
  });

  describe('Roles decorator', () => {
    it('should call SetMetadata with correct parameters for single role', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('ADMIN');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['ADMIN']);
      expect(result).toBe(mockDecorator);
    });

    it('should call SetMetadata with correct parameters for multiple roles', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('ADMIN', 'USER', 'MANAGER');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['ADMIN', 'USER', 'MANAGER']);
      expect(result).toBe(mockDecorator);
    });

    it('should handle empty roles array', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles();

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
      expect(result).toBe(mockDecorator);
    });

    it('should preserve role order', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('MANAGER', 'ADMIN', 'USER');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['MANAGER', 'ADMIN', 'USER']);
      expect(result).toBe(mockDecorator);
    });

    it('should handle duplicate roles', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('ADMIN', 'ADMIN', 'USER');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['ADMIN', 'ADMIN', 'USER']);
      expect(result).toBe(mockDecorator);
    });

    it('should handle special characters in roles', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('ADMIN-ROLE', 'USER_ROLE', 'MANAGER.ROLE');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['ADMIN-ROLE', 'USER_ROLE', 'MANAGER.ROLE']);
      expect(result).toBe(mockDecorator);
    });

    it('should handle numeric strings as roles', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('123', '456');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['123', '456']);
      expect(result).toBe(mockDecorator);
    });

    it('should handle empty string roles', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('', 'ADMIN', '');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['', 'ADMIN', '']);
      expect(result).toBe(mockDecorator);
    });

    it('should handle mixed case roles', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('Admin', 'user', 'MANAGER');

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['Admin', 'user', 'MANAGER']);
      expect(result).toBe(mockDecorator);
    });

    it('should handle long role names', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);
      const longRoleName = 'SUPER_ADMINISTRATOR_WITH_FULL_PERMISSIONS';

      const result = Roles(longRoleName);

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [longRoleName]);
      expect(result).toBe(mockDecorator);
    });
  });

  describe('function behavior', () => {
    it('should be a function', () => {
      expect(typeof Roles).toBe('function');
    });

    it('should return the result of SetMetadata', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      const result = Roles('ADMIN');

      expect(result).toBe(mockDecorator);
    });

    it('should be callable multiple times', () => {
      const mockDecorator1 = jest.fn();
      const mockDecorator2 = jest.fn();
      mockSetMetadata.mockReturnValueOnce(mockDecorator1).mockReturnValueOnce(mockDecorator2);

      const result1 = Roles('ADMIN');
      const result2 = Roles('USER');

      expect(result1).toBe(mockDecorator1);
      expect(result2).toBe(mockDecorator2);
      expect(mockSetMetadata).toHaveBeenCalledTimes(2);
    });

    it('should handle spread operator correctly', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);
      const rolesArray = ['ADMIN', 'USER'];

      const result = Roles(...rolesArray);

      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, rolesArray);
      expect(result).toBe(mockDecorator);
    });
  });

  describe('integration with SetMetadata', () => {
    it('should use the correct metadata key', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      Roles('ADMIN');

      expect(mockSetMetadata).toHaveBeenCalledWith('roles', ['ADMIN']);
    });

    it('should call SetMetadata only once per invocation', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      Roles('ADMIN', 'USER');

      expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should pass roles as an array to SetMetadata', () => {
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      Roles('ADMIN');

      const [key, value] = mockSetMetadata.mock.calls[0];
      expect(key).toBe(ROLES_KEY);
      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['ADMIN']);
    });
  });
});
