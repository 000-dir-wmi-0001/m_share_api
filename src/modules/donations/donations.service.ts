import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../../common/entities';
import { CreateDonationDto, DonationResponseDto } from '../../common/dtos';
import { DonationStatus } from '../../common/enums';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private donationsRepository: Repository<Donation>,
  ) {}

  async create(createDonationDto: CreateDonationDto, userId: string): Promise<DonationResponseDto> {
    const donation = this.donationsRepository.create({
      ...createDonationDto,
      user_id: userId,
      status: DonationStatus.PENDING,
    });

    const savedDonation = await this.donationsRepository.save(donation);
    return this.formatDonationResponse(savedDonation);
  }

  async findUserDonations(userId: string, limit: number = 20, offset: number = 0) {
    const [donations, total] = await this.donationsRepository.findAndCount({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: donations.map(d => this.formatDonationResponse(d)),
      total,
    };
  }

  async findOne(id: string): Promise<DonationResponseDto> {
    const donation = await this.donationsRepository.findOne({ where: { id } });
    if (!donation) {
      throw new NotFoundException('Donation not found');
    }
    return this.formatDonationResponse(donation);
  }

  async updateStatus(id: string, status: string): Promise<DonationResponseDto> {
    const donation = await this.donationsRepository.findOne({ where: { id } });
    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    donation.status = status as DonationStatus;
    donation.updated_at = new Date();
    const updatedDonation = await this.donationsRepository.save(donation);

    return this.formatDonationResponse(updatedDonation);
  }

  private formatDonationResponse(donation: Donation): DonationResponseDto {
    return donation as DonationResponseDto;
  }
}
