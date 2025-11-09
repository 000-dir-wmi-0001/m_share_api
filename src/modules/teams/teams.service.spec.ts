import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Team } from '../../common/entities';
import { TeamsService } from './teams.service';
import { TeamStatus } from '../../common/enums';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    slug: 'test-team',
    owner_id: 'user-1',
    is_private: false,
    status: TeamStatus.ACTIVE,
    member_count: 5,
    project_count: 3,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-02'),
    description: 'A test team',
  };

  const mockTeamRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: getRepositoryToken(Team),
          useValue: mockTeamRepository,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    jest.clearAllMocks();
  });

  describe('getTeamStats', () => {
    it('should return team statistics', async () => {
      mockTeamRepository.findOne.mockResolvedValue(mockTeam);

      const result = await service.getTeamStats('team-1');

      expect(result).toEqual({
        teamId: 'team-1',
        name: 'Test Team',
        memberCount: 5,
        projectCount: 3,
        createdAt: mockTeam.created_at,
        status: TeamStatus.ACTIVE,
      });
      expect(mockTeamRepository.findOne).toHaveBeenCalledWith({ where: { id: 'team-1' } });
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockTeamRepository.findOne.mockResolvedValue(null);

      await expect(service.getTeamStats('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle zero member and project counts', async () => {
      const emptyTeam = { ...mockTeam, member_count: 0, project_count: 0 };
      mockTeamRepository.findOne.mockResolvedValue(emptyTeam);

      const result = await service.getTeamStats('team-1');

      expect(result.memberCount).toBe(0);
      expect(result.projectCount).toBe(0);
    });
  });

  describe('incrementMemberCount', () => {
    it('should increment member count', async () => {
      mockTeamRepository.findOne.mockResolvedValue({ ...mockTeam, member_count: 5 });
      mockTeamRepository.save.mockResolvedValue({ ...mockTeam, member_count: 6 });

      await service.incrementMemberCount('team-1');

      expect(mockTeamRepository.save).toHaveBeenCalled();
    });
  });

  describe('decrementMemberCount', () => {
    it('should decrement member count', async () => {
      mockTeamRepository.findOne.mockResolvedValue({ ...mockTeam, member_count: 5 });
      mockTeamRepository.save.mockResolvedValue({ ...mockTeam, member_count: 4 });

      await service.decrementMemberCount('team-1');

      expect(mockTeamRepository.save).toHaveBeenCalled();
    });

    it('should not go below zero', async () => {
      mockTeamRepository.findOne.mockResolvedValue({ ...mockTeam, member_count: 0 });

      await service.decrementMemberCount('team-1');

      expect(mockTeamRepository.save).not.toHaveBeenCalled();
    });
  });
});
