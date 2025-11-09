import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto, UserResponseDto } from '../../common/dtos';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const valid = await this.usersService.verifyPassword(
      password,
      user.password_hash,
    );
    if (!valid) return null;
    return user;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    } as any);

    await this.usersService.updateLastLogin(user.id);

    const { password_hash, ...userWithoutPassword } = user;
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'default_jwt_secret',
      }) as JwtPayload;

      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
      };

      const accessToken = this.jwtService.sign(newPayload);
      const newRefresh = this.jwtService.sign(newPayload, {
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      } as any);

      return { accessToken, refreshToken: newRefresh };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout() {
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('Email not found');

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' } as any);

    const resetLink = `${
      process.env.FRONTEND_URL || 'http://localhost:3000'
    }/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(email, token, resetLink);

    return { resetToken: token };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      const user = await this.usersService.findOne(payload.sub);
      if (!user) throw new BadRequestException('Invalid token');
      await this.usersService.update(user.id, {
        password: newPassword,
      } as any);
      return { success: true };
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      const user = await this.usersService.findOne(payload.sub);
      if (!user) throw new BadRequestException('Invalid token');
      await this.usersService.update(user.id, {
        email_verified: true,
      } as any);
      await this.emailService.sendWelcomeEmail(user.email, user.name);
      return { success: true };
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
