import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../../common/dtos';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user account (for admin purposes)',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any): Promise<UserResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.usersService.findOne(userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update the authenticated user information',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.usersService.update(userId, updateUserDto);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Upload user avatar',
    description: 'Upload a new avatar image for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @Request() req: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @UploadedFile() _file: any,
  ): Promise<UserResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    // In a real app, upload to cloud storage and get URL
    // For now, generate a local URL
    const avatarUrl = `/uploads/avatars/${userId}-${Date.now()}.jpg`;
    return this.usersService.updateAvatar(userId, avatarUrl);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Delete user avatar',
    description: 'Remove the avatar image for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar deleted successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAvatar(@Request() req: any): Promise<UserResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.usersService.deleteAvatar(userId);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Change user password',
    description: 'Change the password for the authenticated user',
  })
  @ApiBody({
    schema: {
      example: {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ): Promise<{ success: boolean; message: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    await this.usersService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
    return { success: true, message: 'Password changed successfully' };
  }

  @Get()
  @ApiOperation({
    summary: 'List all users',
    description: 'Retrieve a paginated list of all users',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of users per page (default: 10)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of users to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved',
    schema: {
      example: {
        data: [],
        total: 0,
      },
    },
  })
  async findAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<{ data: UserResponseDto[]; total: number }> {
    return this.usersService.findAll(limit, offset);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search users',
    description: 'Search for users by name or email',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per page (default: 10)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of results to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved',
    schema: {
      example: {
        data: [],
        total: 0,
      },
    },
  })
  async searchUsers(
    @Query('query') query: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<{ data: UserResponseDto[]; total: number }> {
    if (!query) {
      return { data: [], total: 0 };
    }
    return this.usersService.searchUsers(query, limit, offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update user by ID',
    description: 'Update a specific user by their ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user by ID',
    description: 'Delete a specific user by their ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}

