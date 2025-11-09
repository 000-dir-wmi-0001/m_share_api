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
} from '@nestjs/common';
import { SponsorshipsService } from './sponsorships.service';

@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSponsorshipDto: any,
    @Request() req: any,
  ) {
    return this.sponsorshipsService.create(createSponsorshipDto, req.user?.id);
  }

  @Get('users/:userId')
  async findUserSponsorships(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.sponsorshipsService.findUserSponsorships(userId, limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sponsorshipsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSponsorshipDto: any,
  ) {
    return this.sponsorshipsService.update(id, updateSponsorshipDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.sponsorshipsService.remove(id);
  }
}
