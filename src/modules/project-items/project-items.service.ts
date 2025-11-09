import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectItem } from '../../common/entities';
import { CreateProjectItemDto, UpdateProjectItemDto, ProjectItemResponseDto } from '../../common/dtos';

@Injectable()
export class ProjectItemsService {
  constructor(
    @InjectRepository(ProjectItem)
    private projectItemsRepository: Repository<ProjectItem>,
  ) {}

  async create(projectId: string, createItemDto: CreateProjectItemDto): Promise<ProjectItemResponseDto> {
    const item = this.projectItemsRepository.create({
      project_id: projectId,
      ...createItemDto,
      view_count: 0,
      copy_count: 0,
    });

    const savedItem = await this.projectItemsRepository.save(item);
    return this.formatItemResponse(savedItem);
  }

  async findByProject(projectId: string, limit: number = 50, offset: number = 0) {
    const [items, total] = await this.projectItemsRepository.findAndCount({
      where: { project_id: projectId },
      take: limit,
      skip: offset,
      order: { order: 'ASC' },
    });

    return {
      data: items.map(i => this.formatItemResponse(i)),
      total,
    };
  }

  async findOne(id: string): Promise<ProjectItemResponseDto> {
    const item = await this.projectItemsRepository.findOne({ where: { id } });
    if (!item) throw new Error('Project item not found');
    return this.formatItemResponse(item);
  }

  async update(id: string, updateItemDto: UpdateProjectItemDto): Promise<ProjectItemResponseDto> {
    const item = await this.projectItemsRepository.findOne({ where: { id } });
    if (!item) throw new Error('Project item not found');

    Object.assign(item, updateItemDto);
    const updatedItem = await this.projectItemsRepository.save(item);
    return this.formatItemResponse(updatedItem);
  }

  async remove(id: string): Promise<void> {
    await this.projectItemsRepository.delete(id);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.projectItemsRepository.increment({ id }, 'view_count', 1);
  }

  private formatItemResponse(item: ProjectItem): ProjectItemResponseDto {
    return item as ProjectItemResponseDto;
  }
}
