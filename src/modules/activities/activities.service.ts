import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../../common/entities';
import { ActivityResponseDto } from '../../common/dtos';
import { ActivityType } from '../../common/enums';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) {}

  async logActivity(data: {
    user_id: string;
    project_id?: string;
    type: string;
    action: string;
    description: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
  }): Promise<ActivityResponseDto> {
    const activity = this.activitiesRepository.create({
      user_id: data.user_id,
      project_id: data.project_id,
      type: data.type as ActivityType,
      action: data.action,
      description: data.description,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      metadata: data.metadata,
    });

    const savedActivity = await this.activitiesRepository.save(activity);
    return this.formatActivityResponse(savedActivity);
  }

  async getUserActivities(userId: string, limit: number = 50, offset: number = 0) {
    const [activities, total] = await this.activitiesRepository.findAndCount({
      where: { user_id: userId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: activities.map(a => this.formatActivityResponse(a)),
      total,
    };
  }

  async getProjectActivities(projectId: string, limit: number = 50, offset: number = 0) {
    const [activities, total] = await this.activitiesRepository.findAndCount({
      where: { project_id: projectId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: activities.map(a => this.formatActivityResponse(a)),
      total,
    };
  }

  private formatActivityResponse(activity: Activity): ActivityResponseDto {
    return activity as ActivityResponseDto;
  }
}
