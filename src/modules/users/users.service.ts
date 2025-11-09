import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../../common/dtos';
import { UserStatus } from '../../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, name } = createUserDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.usersRepository.create({
      email,
      name,
      password_hash: hashedPassword,
      status: UserStatus.ACTIVE,
      email_verified: false,
      two_factor_enabled: false,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.formatUserResponse(savedUser);
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<{ data: UserResponseDto[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: users.map(user => this.formatUserResponse(user)),
      total,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      user.password_hash = hashedPassword;
    }

    // Copy other fields
    Object.assign(user, { ...updateUserDto, password: undefined });
    const updatedUser = await this.usersRepository.save(user);

    return this.formatUserResponse(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      last_login_at: new Date(),
    });
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedNewPassword;
    await this.usersRepository.save(user);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatar_url = avatarUrl;
    const updatedUser = await this.usersRepository.save(user);
    return this.formatUserResponse(updatedUser);
  }

  async deleteAvatar(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatar_url = '';
    const updatedUser = await this.usersRepository.save(user);
    return this.formatUserResponse(updatedUser);
  }

  async searchUsers(query: string, limit: number = 10, offset: number = 0): Promise<{ data: UserResponseDto[]; total: number }> {
    const [users, total] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.email ILIKE :query', { query: `%${query}%` })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .take(limit)
      .skip(offset)
      .orderBy('user.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: users.map(user => this.formatUserResponse(user)),
      total,
    };
  }

  private formatUserResponse(user: User): UserResponseDto {
    const { password_hash, two_factor_secret, ...userWithoutSensitive } = user;
    return userWithoutSensitive as UserResponseDto;
  }
}
