import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSetting, TeamSetting } from '../../common/entities';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private userSettingsRepository: Repository<UserSetting>,
    @InjectRepository(TeamSetting)
    private teamSettingsRepository: Repository<TeamSetting>,
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

  async getTeamSettings(teamId: string): Promise<TeamSetting> {
    let settings = await this.teamSettingsRepository.findOne({
      where: { team_id: teamId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = this.teamSettingsRepository.create({
        team_id: teamId,
        public_team: false,
        members_can_invite: true,
        members_can_create_projects: true,
        allow_public_sharing: true,
      });
      settings = await this.teamSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateTeamSettings(
    teamId: string,
    updateData: Partial<TeamSetting>,
  ): Promise<TeamSetting> {
    let settings = await this.teamSettingsRepository.findOne({
      where: { team_id: teamId },
    });

    if (!settings) {
      settings = this.teamSettingsRepository.create({
        team_id: teamId,
      });
    }

    Object.assign(settings, updateData);
    return this.teamSettingsRepository.save(settings);
  }
}
