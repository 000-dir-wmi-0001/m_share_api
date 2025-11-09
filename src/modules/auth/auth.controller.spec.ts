import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto, UserResponseDto } from '../../common/dtos';
import { UserStatus } from '../../common/enums';

describe('AuthController', () => {
  let controller: AuthController;

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

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
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

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return user response', async () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'SecurePassword123',
      };

      mockAuthService.register.mockResolvedValue(mockUserResponse);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(mockUserResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        user: mockUserResponse,
      };

      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(loginResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with refresh token', async () => {
      const refreshToken = 'refresh_token_123';
      const refreshResponse = {
        accessToken: 'new_access_token_123',
        refreshToken: 'new_refresh_token_123',
      };

      mockAuthService.refresh.mockResolvedValue(refreshResponse);

      const result = await controller.refresh({ refreshToken });

      expect(result).toEqual(refreshResponse);
      expect(mockAuthService.refresh).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with email', async () => {
      const email = 'test@example.com';
      const forgotResponse = { resetToken: 'reset_token_123' };

      mockAuthService.forgotPassword.mockResolvedValue(forgotResponse);

      const result = await controller.forgotPassword({ email });

      expect(result).toEqual(forgotResponse);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(email);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with token and new password', async () => {
      const resetDto = {
        token: 'reset_token_123',
        newPassword: 'NewSecurePassword123',
      };

      const resetResponse = { success: true };

      mockAuthService.resetPassword.mockResolvedValue(resetResponse);

      const result = await controller.resetPassword(resetDto);

      expect(result).toEqual(resetResponse);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetDto.token,
        resetDto.newPassword,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with token', async () => {
      const token = 'verify_token_123';
      const verifyResponse = { success: true };

      mockAuthService.verifyEmail.mockResolvedValue(verifyResponse);

      const result = await controller.verifyEmail(token);

      expect(result).toEqual(verifyResponse);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId from request.user', async () => {
      const logoutResponse = { success: true };
      const mockRequest = {
        user: { userId: 'user-1', email: 'test@example.com' },
      };

      mockAuthService.logout.mockResolvedValue(logoutResponse);

      const result = await controller.logout(mockRequest as any);

      expect(result).toEqual(logoutResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
    });
  });
});
