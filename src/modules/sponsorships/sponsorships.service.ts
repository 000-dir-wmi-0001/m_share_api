import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sponsorship } from '../../common/entities';
import { SponsorshipStatus } from '../../common/enums';

@Injectable()
export class SponsorshipsService {
  constructor(
    @InjectRepository(Sponsorship)
    private sponsorshipsRepository: Repository<Sponsorship>,
  ) {}

  async create(createSponsorshipDto: any, userId: string): Promise<any> {
    const sponsorship = this.sponsorshipsRepository.create({
      ...createSponsorshipDto,
      user_id: userId,
      status: SponsorshipStatus.ACTIVE,
    });

    const savedSponsorship = await this.sponsorshipsRepository.save(sponsorship);
    return this.formatSponsorshipResponse(
      Array.isArray(savedSponsorship) ? savedSponsorship[0] : savedSponsorship,
    );
  }

  async findUserSponsorships(userId: string, limit: number = 20, offset: number = 0) {
    const [sponsorships, total] = await this.sponsorshipsRepository.findAndCount({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: sponsorships.map(s => this.formatSponsorshipResponse(s)),
      total,
    };
  }

  async findOne(id: string): Promise<any> {
    const sponsorship = await this.sponsorshipsRepository.findOne({ where: { id } });
    if (!sponsorship) {
      throw new NotFoundException('Sponsorship not found');
    }
    return this.formatSponsorshipResponse(sponsorship);
  }

  async update(id: string, updateSponsorshipDto: any): Promise<any> {
    const sponsorship = await this.sponsorshipsRepository.findOne({ where: { id } });
    if (!sponsorship) {
      throw new NotFoundException('Sponsorship not found');
    }

    Object.assign(sponsorship, updateSponsorshipDto);
    sponsorship.updated_at = new Date();
    const updatedSponsorship = await this.sponsorshipsRepository.save(sponsorship);

    return this.formatSponsorshipResponse(updatedSponsorship);
  }

  async remove(id: string): Promise<void> {
    await this.sponsorshipsRepository.delete(id);
  }

  private formatSponsorshipResponse(sponsorship: Sponsorship): any {
    return sponsorship;
  }
}
