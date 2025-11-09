import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from '../../common/entities';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from '../../common/enums';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    slug: 'test-project',
    owner_id: 'user-1',
    team_id: 'team-1',
    description: 'A test project',
    status: ProjectStatus.DRAFT,
    visibility: 'PRIVATE',
    is_password_protected: false,
    password_hash: null,
    member_count: 1,
    item_count: 0,
    share_count: 0,
    view_count: 0,
    copy_count: 0,
    storage_used: 0,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-02'),
    metadata: null,
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('archive', () => {
    it('should archive a project', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      const archivedProject = {
        ...mockProject,
        status: ProjectStatus.ARCHIVED,
        metadata: { archivedAt: expect.any(Date), archivedBy: 'user-1' },
      };
      mockProjectRepository.save.mockResolvedValue(archivedProject);

      const result = await service.archive('project-1', 'user-1');

      expect(result.status).toBe(ProjectStatus.ARCHIVED);
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.archive('nonexistent-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not project owner', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      await expect(service.archive('project-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('restore', () => {
    it('should restore an archived project', async () => {
      const archivedProject = {
        ...mockProject,
        status: ProjectStatus.ARCHIVED,
      };
      mockProjectRepository.findOne.mockResolvedValue(archivedProject);
      const restoredProject = {
        ...archivedProject,
        status: ProjectStatus.ACTIVE,
        metadata: { restoredAt: expect.any(Date), restoredBy: 'user-1' },
      };
      mockProjectRepository.save.mockResolvedValue(restoredProject);

      const result = await service.restore('project-1', 'user-1');

      expect(result.status).toBe(ProjectStatus.ACTIVE);
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.restore('nonexistent-id', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not project owner', async () => {
      const archivedProject = {
        ...mockProject,
        status: ProjectStatus.ARCHIVED,
      };
      mockProjectRepository.findOne.mockResolvedValue(archivedProject);

      await expect(service.restore('project-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if project is not archived', async () => {
      const draftProject = {
        ...mockProject,
        status: ProjectStatus.DRAFT,
      };
      mockProjectRepository.findOne.mockResolvedValue(draftProject);

      await expect(service.restore('project-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('duplicate', () => {
    it('should duplicate a project', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      const duplicatedProject = {
        ...mockProject,
        id: 'project-2',
        name: 'Test Project - Copy',
        slug: 'test-project-copy',
        owner_id: 'user-1',
        metadata: {
          duplicatedFrom: 'project-1',
          duplicatedAt: expect.any(Date),
          duplicatedBy: 'user-1',
          includeMembers: false,
          includeFiles: false,
        },
      };
      mockProjectRepository.create.mockReturnValue(duplicatedProject);
      mockProjectRepository.save.mockResolvedValue(duplicatedProject);

      const result = await service.duplicate('project-1', 'user-1', 'Test Project - Copy', false, false);

      expect(result.name).toBe('Test Project - Copy');
      expect(result.owner_id).toBe('user-1');
      expect(mockProjectRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if source project does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(
        service.duplicate('nonexistent-id', 'user-1', 'New Project', false, false),
      ).rejects.toThrow(NotFoundException);
    });

    it('should duplicate with includeMembers and includeFiles flags', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      const duplicatedProject = {
        ...mockProject,
        id: 'project-2',
        name: 'Test Project - Copy',
        metadata: {
          duplicatedFrom: 'project-1',
          duplicatedAt: expect.any(Date),
          duplicatedBy: 'user-1',
          includeMembers: true,
          includeFiles: true,
        },
      };
      mockProjectRepository.create.mockReturnValue(duplicatedProject);
      mockProjectRepository.save.mockResolvedValue(duplicatedProject);

      const result = await service.duplicate('project-1', 'user-1', 'Test Project - Copy', true, true);

      expect(result).toBeDefined();
      expect(mockProjectRepository.create).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return project statistics', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.getStats('project-1');

      expect(result).toEqual({
        projectId: 'project-1',
        totalMembers: 1,
        totalFiles: 0,
        totalShares: 0,
        totalComments: 0,
        totalDownloads: 0,
        createdAt: mockProject.created_at,
      });
    });

    it('should throw NotFoundException if project does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.getStats('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return correct counts from project', async () => {
      const projectWithStats = {
        ...mockProject,
        member_count: 5,
        item_count: 10,
        share_count: 3,
      };
      mockProjectRepository.findOne.mockResolvedValue(projectWithStats);

      const result = await service.getStats('project-1');

      expect(result.totalMembers).toBe(5);
      expect(result.totalFiles).toBe(10);
      expect(result.totalShares).toBe(3);
    });
  });
});
