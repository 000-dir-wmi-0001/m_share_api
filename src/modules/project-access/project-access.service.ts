import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectAccess } from '../../common/entities';
import { AccessType } from '../../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(ProjectAccess)
    private projectAccessRepository: Repository<ProjectAccess>,
  ) {}

  async grantAccess(data: {
    project_id: string;
    user_id?: string;
    access_type: string;
    token?: string;
    is_password_protected: boolean;
    password?: string;
    allow_download: boolean;
    allow_share: boolean;
    allow_view_notifications: boolean;
    expires_at?: Date;
  }): Promise<any> {
    const access = this.projectAccessRepository.create({
      project_id: data.project_id,
      user_id: data.user_id,
      access_type: data.access_type as AccessType,
      token: data.token,
      is_password_protected: data.is_password_protected,
      password_hash: data.is_password_protected && data.password ? await bcrypt.hash(data.password, 10) : null,
      allow_download: data.allow_download,
      allow_share: data.allow_share,
      allow_view_notifications: data.allow_view_notifications,
      expires_at: data.expires_at,
      view_count: 0,
    });

    const savedAccess = await this.projectAccessRepository.save(access);
    return this.formatAccessResponse(savedAccess);
  }

  async findProjectAccess(projectId: string, limit: number = 50, offset: number = 0) {
    const [accesses, total] = await this.projectAccessRepository.findAndCount({
      where: { project_id: projectId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: accesses.map(a => this.formatAccessResponse(a)),
      total,
    };
  }

  async findByToken(token: string): Promise<any> {
    const access = await this.projectAccessRepository.findOne({ where: { token } });
    if (!access) {
      throw new NotFoundException('Access token not found');
    }
    return this.formatAccessResponse(access);
  }

  async findOne(id: string): Promise<any> {
    const access = await this.projectAccessRepository.findOne({ where: { id } });
    if (!access) {
      throw new NotFoundException('Access not found');
    }
    return this.formatAccessResponse(access);
  }

  async update(id: string, updateData: any): Promise<any> {
    const access = await this.projectAccessRepository.findOne({ where: { id } });
    if (!access) {
      throw new NotFoundException('Access not found');
    }

    Object.assign(access, updateData);
    const updatedAccess = await this.projectAccessRepository.save(access);
    return this.formatAccessResponse(updatedAccess);
  }

  async remove(id: string): Promise<void> {
    await this.projectAccessRepository.delete(id);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.projectAccessRepository.increment({ id }, 'view_count', 1);
  }

  private formatAccessResponse(access: ProjectAccess): any {
    return access;
  }
}
