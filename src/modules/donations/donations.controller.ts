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
} from '@nestjs/common';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDonationDto: any,
    @Request() req: any,
  ) {
    return this.donationsService.create(createDonationDto, req.user?.id);
  }

  @Get('users/:userId')
  async findUserDonations(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.donationsService.findUserDonations(userId, limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.donationsService.findOne(id);
  }
}
