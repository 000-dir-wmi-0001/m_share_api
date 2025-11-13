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
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SponsorshipsService } from './sponsorships.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('sponsorships')
@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Create a new sponsorship',
    description: 'Create a sponsorship offer from the authenticated user',
  })
  @ApiBody({
    schema: {
      example: {
        projectId: 'uuid',
        amount: 100,
        duration: 'monthly',
        message: 'We believe in your project',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Sponsorship created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createSponsorshipDto: any,
    @Request() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.sponsorshipsService.create(createSponsorshipDto, req.user?.id);
  }

  @Get('users/:userId')
  @ApiOperation({
    summary: 'Get user sponsorships',
    description: 'Retrieve all sponsorships made by a specific user',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of sponsorships per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of sponsorships to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'User sponsorships retrieved',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserSponsorships(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.sponsorshipsService.findUserSponsorships(userId, limit, offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get sponsorship by ID',
    description: 'Retrieve a specific sponsorship by its ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Sponsorship ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Sponsorship retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Sponsorship not found' })
  async findOne(@Param('id') id: string) {
    return this.sponsorshipsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Update sponsorship',
    description: 'Update a sponsorship (requires ownership)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Sponsorship ID',
  })
  @ApiBody({
    schema: {
      example: {
        amount: 150,
        message: 'Updated sponsorship message',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sponsorship updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Sponsorship not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSponsorshipDto: any,
  ) {
    return this.sponsorshipsService.update(id, updateSponsorshipDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Delete sponsorship',
    description: 'Delete a sponsorship (requires ownership)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Sponsorship ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Sponsorship deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Sponsorship not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.sponsorshipsService.remove(id);
  }
}
