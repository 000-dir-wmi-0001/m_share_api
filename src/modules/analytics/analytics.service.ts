import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectFile, Activity } from '../../common/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectFile)
    private filesRepository: Repository<ProjectFile>,
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
  ) {}

  async getUserAnalytics(userId: string): Promise<any> {
    const totalProjects = await this.projectsRepository.count({
      where: { owner_id: userId },
    });

    const filesUploaded = await this.filesRepository.count({
      where: { uploaded_by_id: userId },
    });

    const recentActivity = await this.activitiesRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    return {
      totalProjects,
      filesUploaded,
      lastActive: recentActivity?.created_at || null,
      userId,
      timestamp: new Date(),
    };
  }

  async getProjectAnalytics(projectId: string): Promise<any> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });

    const totalFiles = await this.filesRepository.count({
      where: { project_id: projectId },
    });

    const totalDownloads = await this.filesRepository
      .createQueryBuilder('file')
      .where('file.project_id = :projectId', { projectId })
      .select('SUM(file.download_count)', 'total')
      .getRawOne();

    const activities = await this.activitiesRepository.count({
      where: { project_id: projectId },
    });

    return {
      projectId,
      name: project?.name || '',
      totalFiles,
      totalDownloads: parseInt(totalDownloads?.total || '0'),
      totalActivities: activities,
      status: project?.status || '',
      createdAt: project?.created_at || null,
      timestamp: new Date(),
    };
  }
}
