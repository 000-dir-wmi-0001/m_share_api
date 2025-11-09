import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sponsorship } from '../../common/entities';
import { SponsorshipsService } from './sponsorships.service';
import { SponsorshipsController } from './sponsorships.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sponsorship])],
  providers: [SponsorshipsService],
  controllers: [SponsorshipsController],
  exports: [SponsorshipsService],
})
export class SponsorshipsModule {}
