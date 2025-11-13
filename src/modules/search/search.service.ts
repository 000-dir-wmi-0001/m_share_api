import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectFile, User } from '../../common/entities';
import { UserStatus, ProjectStatus, Visibility } from '../../common/enums';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectFile)
    private filesRepository: Repository<ProjectFile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async globalSearch(
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    projects: any[];
    files: any[];
    users: any[];
    total: number;
  }> {
    const searchQuery = `%${query}%`;

    const [projects, projectCount] = await this.projectsRepository
      .createQueryBuilder('project')
      .where('project.name ILIKE :query OR project.description ILIKE :query', { query: searchQuery })
      .andWhere('project.status = :status', { status: ProjectStatus.ACTIVE })
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const [files, fileCount] = await this.filesRepository
      .createQueryBuilder('file')
      .where('file.name ILIKE :query OR file.description ILIKE :query', { query: searchQuery })
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const [users, userCount] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.email ILIKE :query', { query: searchQuery })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: 'project',
      })),
      files: files.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        type: 'file',
      })),
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        type: 'user',
      })),
      total: projectCount + fileCount + userCount,
    };
  }

  async searchProjects(
    query: string,
    limit: number = 20,
    offset: number = 0,
    userId?: string,
  ): Promise<{ data: any[]; total: number }> {
    const searchQuery = `%${query}%`;

    let queryBuilder = this.projectsRepository
      .createQueryBuilder('project')
      .where('project.name ILIKE :query OR project.description ILIKE :query', { query: searchQuery })
      .andWhere('project.status = :status', { status: ProjectStatus.ACTIVE });

    // If user is provided, filter by visibility and ownership
    if (userId) {
      queryBuilder = queryBuilder.andWhere(
        '(project.visibility = :visibility OR project.owner_id = :userId)',
        { visibility: Visibility.PUBLIC, userId },
      );
    } else {
      queryBuilder = queryBuilder.andWhere('project.visibility = :visibility', { visibility: Visibility.PUBLIC });
    }

    const [projects, total] = await queryBuilder
      .orderBy('project.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      data: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        visibility: p.visibility,
        created_at: p.created_at,
      })),
      total,
    };
  }

  async searchFiles(
    query: string,
    limit: number = 20,
    offset: number = 0,
    projectId?: string,
  ): Promise<{ data: any[]; total: number }> {
    const searchQuery = `%${query}%`;

    let queryBuilder = this.filesRepository
      .createQueryBuilder('file')
      .where('file.name ILIKE :query OR file.description ILIKE :query', { query: searchQuery });

    if (projectId) {
      queryBuilder = queryBuilder.andWhere('file.project_id = :projectId', { projectId });
    }

    const [files, total] = await queryBuilder
      .orderBy('file.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      data: files.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        size: f.size,
        mime_type: f.mime_type,
        folder: f.folder,
        created_at: f.created_at,
      })),
      total,
    };
  }

  async searchUsers(
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: any[]; total: number }> {
    const searchQuery = `%${query}%`;

    const [users, total] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.email ILIKE :query', { query: searchQuery })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .orderBy('user.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return {
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url,
      })),
      total,
    };
  }
}
