import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeamMember } from '../../common/entities';
import { TeamMembersService } from './team-members.service';
import { MemberStatus } from '../../common/enums';

describe('TeamMembersService', () => {
  let service: TeamMembersService;

  const mockTeamMember = {
    id: 'member-1',
    team_id: 'team-1',
    user_id: 'user-1',
    role: 'MEMBER',
    status: MemberStatus.ACTIVE,
    joined_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-02'),
  };

  const mockTeamMemberRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamMembersService,
        {
          provide: getRepositoryToken(TeamMember),
          useValue: mockTeamMemberRepository,
        },
      ],
    }).compile();

    service = module.get<TeamMembersService>(TeamMembersService);
    jest.clearAllMocks();
  });

  describe('leaveTeam', () => {
    it('should allow a member to leave a team', async () => {
      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);
      mockTeamMemberRepository.remove.mockResolvedValue(undefined);

      await service.leaveteam('team-1', 'user-1');

      expect(mockTeamMemberRepository.findOne).toHaveBeenCalledWith({
        where: { team_id: 'team-1', user_id: 'user-1' },
      });
      expect(mockTeamMemberRepository.remove).toHaveBeenCalledWith(mockTeamMember);
    });

    it('should throw NotFoundException if user is not a member', async () => {
      mockTeamMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.leaveteam('team-1', 'user-99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMember', () => {
    it('should add a new member to team', async () => {
      mockTeamMemberRepository.create.mockReturnValue(mockTeamMember);
      mockTeamMemberRepository.save.mockResolvedValue(mockTeamMember);

      const result = await service.addMember('team-1', { user_id: 'user-1', role: 'MEMBER' }, 'owner-id');

      expect(result).toEqual(mockTeamMember);
      expect(mockTeamMemberRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          team_id: 'team-1',
          user_id: 'user-1',
          role: 'MEMBER',
        }),
      );
    });
  });

  describe('findTeamMembers', () => {
    it('should return team members with pagination', async () => {
      const members = [mockTeamMember, { ...mockTeamMember, id: 'member-2', user_id: 'user-2' }];
      mockTeamMemberRepository.findAndCount.mockResolvedValue([members, 2]);

      const result = await service.findTeamMembers('team-1', 10, 0);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockTeamMemberRepository.findAndCount).toHaveBeenCalledWith({
        where: { team_id: 'team-1' },
        take: 10,
        skip: 0,
        order: { joined_at: 'DESC' },
      });
    });
  });

  describe('removeMember', () => {
    it('should remove a member from team', async () => {
      mockTeamMemberRepository.findOne.mockResolvedValue(mockTeamMember);
      mockTeamMemberRepository.remove.mockResolvedValue(undefined);

      await service.removeMember('member-1', 'owner-id');

      expect(mockTeamMemberRepository.remove).toHaveBeenCalledWith(mockTeamMember);
    });

    it('should throw NotFoundException if member does not exist', async () => {
      mockTeamMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.removeMember('nonexistent-id', 'owner-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
