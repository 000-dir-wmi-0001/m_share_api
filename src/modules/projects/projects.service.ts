import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../common/entities';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from '../../common/dtos';
import { ProjectStatus } from '../../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const { name, description, team_id, visibility, is_password_protected, password } = createProjectDto;

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const project = this.projectsRepository.create({
      name,
      description,
      slug,
      owner_id: userId,
      team_id,
      visibility,
      status: ProjectStatus.DRAFT,
      is_password_protected,
      password_hash: is_password_protected && password ? await bcrypt.hash(password, 10) : null,
      member_count: 1,
      item_count: 0,
      storage_used: 0,
    });

    const savedProject = await this.projectsRepository.save(project);
    return this.formatProjectResponse(savedProject);
  }

  async findAll(limit: number = 10, offset: number = 0) {
    const [projects, total] = await this.projectsRepository.findAndCount({
      where: { status: ProjectStatus.ACTIVE },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: projects.map(p => this.formatProjectResponse(p)),
      total,
    };
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['owner', 'team'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.formatProjectResponse(project);
  }

  async findBySlug(slug: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({
      where: { slug },
      relations: ['owner', 'team'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.formatProjectResponse(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check ownership
    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can update project');
    }

    Object.assign(project, updateProjectDto);
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async publish(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can publish project');
    }

    project.status = ProjectStatus.ACTIVE;
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can delete project');
    }

    await this.projectsRepository.remove(project);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.projectsRepository.increment({ id }, 'view_count', 1);
  }

  async archive(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can archive project');
    }

    project.status = ProjectStatus.ARCHIVED;
    project.metadata = {
      ...project.metadata,
      archivedAt: new Date(),
      archivedBy: userId,
    };
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async restore(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can restore project');
    }

    if (project.status !== ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Project is not archived');
    }

    project.status = ProjectStatus.ACTIVE;
    project.metadata = {
      ...project.metadata,
      restoredAt: new Date(),
      restoredBy: userId,
    };
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async duplicate(
    id: string,
    userId: string,
    name: string,
    includeMembers: boolean = false,
    includeFiles: boolean = false,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create slug from new name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const duplicatedProject = this.projectsRepository.create({
      name,
      description: project.description,
      slug,
      owner_id: userId,
      team_id: project.team_id,
      visibility: project.visibility,
      status: ProjectStatus.DRAFT,
      is_password_protected: false,
      member_count: 1,
      item_count: 0,
      storage_used: 0,
      metadata: {
        duplicatedFrom: id,
        duplicatedAt: new Date(),
        duplicatedBy: userId,
        includeMembers,
        includeFiles,
      },
    });

    const savedProject = await this.projectsRepository.save(duplicatedProject);

    // TODO: Copy files if includeFiles is true
    // TODO: Copy members if includeMembers is true

    return this.formatProjectResponse(savedProject);
  }

  async getStats(id: string): Promise<{
    projectId: string;
    totalMembers: number;
    totalFiles: number;
    totalShares: number;
    totalComments: number;
    totalDownloads: number;
    createdAt: Date;
  }> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      projectId: project.id,
      totalMembers: project.member_count,
      totalFiles: project.item_count,
      totalShares: project.share_count,
      totalComments: 0, // TODO: Fetch from comments table
      totalDownloads: 0, // TODO: Fetch from downloads table
      createdAt: project.created_at,
    };
  }

  private formatProjectResponse(project: Project): ProjectResponseDto {
    return project as ProjectResponseDto;
  }
}
