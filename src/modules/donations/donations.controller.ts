import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Create a new donation',
    description: 'Create a donation from the authenticated user',
  })
  @ApiBody({
    schema: {
      example: {
        projectId: 'uuid',
        amount: 50,
        currency: 'USD',
        message: 'Support your work',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Donation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createDonationDto: any,
    @Request() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.donationsService.create(createDonationDto, req.user?.id);
  }

  @Get('users/:userId')
  @ApiOperation({
    summary: 'Get user donations',
    description: 'Retrieve all donations made by a specific user',
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
    description: 'Number of donations per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of donations to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'User donations retrieved',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserDonations(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.donationsService.findUserDonations(userId, limit, offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get donation by ID',
    description: 'Retrieve a specific donation by its ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Donation ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Donation retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Donation not found' })
  async findOne(@Param('id') id: string) {
    return this.donationsService.findOne(id);
  }
}
