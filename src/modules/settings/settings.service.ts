import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSetting } from '../../common/entities';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private userSettingsRepository: Repository<UserSetting>,
  ) {}

  async getUserSettings(userId: string): Promise<UserSetting> {
    let settings = await this.userSettingsRepository.findOne({
      where: { user_id: userId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = this.userSettingsRepository.create({
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        theme: 'light',
        language: 'en',
      });
      settings = await this.userSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateUserSettings(
    userId: string,
    updateData: Partial<UserSetting>,
  ): Promise<UserSetting> {
    let settings = await this.userSettingsRepository.findOne({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = this.userSettingsRepository.create({
        user_id: userId,
      });
    }

    Object.assign(settings, updateData);
    return this.userSettingsRepository.save(settings);
  }
}
