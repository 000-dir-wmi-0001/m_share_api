import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { CreateUserDto, UserResponseDto } from '../../common/dtos';
import { UserStatus } from '../../common/enums';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    password_hash: '$2b$10$hashedpassword',
  };

  const mockUserResponse: UserResponseDto = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    status: UserStatus.ACTIVE,
    email_verified: false,
    two_factor_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    verifyPassword: jest.fn(),
    updateLastLogin: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEmailService = {
    send: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'SecurePassword123',
      };

      mockUsersService.create.mockResolvedValue(mockUserResponse);

      const result = await service.register(createUserDto);

      expect(result).toEqual(mockUserResponse);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.verifyPassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.verifyPassword).toHaveBeenCalledWith(
        'password123',
        mockUser.password_hash,
      );
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.verifyPassword.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const accessToken = 'access_token_123';
      const refreshToken = 'refresh_token_123';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.verifyPassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);
      mockConfigService.get.mockReturnValue('7d');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken,
        refreshToken,
        user: expect.objectContaining({ id: 'user-1', email: 'test@example.com' }),
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith('user-1');
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.verifyPassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new access and refresh tokens', async () => {
      const oldRefreshToken = 'old_refresh_token';
      const newAccessToken = 'new_access_token';
      const newRefreshToken = 'new_refresh_token';
      const payload = { sub: 'user-1', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(payload);
      mockJwtService.sign.mockReturnValueOnce(newAccessToken).mockReturnValueOnce(newRefreshToken);
      mockConfigService.get.mockReturnValue('7d');

      const result = await service.refresh(oldRefreshToken);

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should return success', async () => {
      const result = await service.logout('user-1');

      expect(result).toEqual({ success: true });
    });
  });

  describe('forgotPassword', () => {
    it('should generate and return a reset token', async () => {
      const resetToken = 'reset_token_123';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(resetToken);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(result).toEqual({ resetToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com' },
        { expiresIn: '1h' },
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword('nonexistent@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'reset_token_123';
      const newPassword = 'NewSecurePassword123';
      const payload = { sub: 'user-1', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(undefined);

      const result = await service.resetPassword(token, newPassword);

      expect(result).toEqual({ success: true });
      expect(mockUsersService.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.resetPassword('invalid_token', 'NewPassword123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'verify_token_123';
      const payload = { sub: 'user-1', email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(undefined);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail(token);

      expect(result).toEqual({ success: true });
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUser.email, mockUser.name);
    });

    it('should throw BadRequestException if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyEmail('invalid_token')).rejects.toThrow(BadRequestException);
    });
  });
});
