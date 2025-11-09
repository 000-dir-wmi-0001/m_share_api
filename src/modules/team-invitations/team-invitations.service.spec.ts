import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeamInvitation } from '../../common/entities';
import { TeamInvitationsService } from './team-invitations.service';
import { InvitationStatus } from '../../common/enums';

describe('TeamInvitationsService', () => {
  let service: TeamInvitationsService;

  const mockInvitation = {
    id: 'invite-1',
    team_id: 'team-1',
    email: 'user@example.com',
    role: 'MEMBER',
    token: 'abc123def456',
    status: InvitationStatus.PENDING,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    invited_by_id: 'owner-1',
    created_at: new Date(),
  };

  const mockInvitationRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamInvitationsService,
        {
          provide: getRepositoryToken(TeamInvitation),
          useValue: mockInvitationRepository,
        },
      ],
    }).compile();

    service = module.get<TeamInvitationsService>(TeamInvitationsService);
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create a new invitation', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);
      mockInvitationRepository.create.mockReturnValue(mockInvitation);
      mockInvitationRepository.save.mockResolvedValue(mockInvitation);

      const result = await service.createInvitation({
        team_id: 'team-1',
        email: 'user@example.com',
        role: 'MEMBER',
        invited_by_id: 'owner-1',
      });

      expect(result).toEqual(mockInvitation);
      expect(mockInvitationRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if invitation already exists', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(mockInvitation);

      await expect(
        service.createInvitation({
          team_id: 'team-1',
          email: 'user@example.com',
          role: 'MEMBER',
          invited_by_id: 'owner-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findTeamInvitations', () => {
    it('should return team invitations with pagination', async () => {
      const invitations = [mockInvitation];
      mockInvitationRepository.findAndCount.mockResolvedValue([invitations, 1]);

      const result = await service.findTeamInvitations('team-1', 20, 0);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockInvitationRepository.findAndCount).toHaveBeenCalledWith({
        where: { team_id: 'team-1' },
        take: 20,
        skip: 0,
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findByToken', () => {
    it('should find invitation by token', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(mockInvitation);

      const result = await service.findByToken('abc123def456');

      expect(result).toEqual(mockInvitation);
    });

    it('should throw NotFoundException if token not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await expect(service.findByToken('invalid-token')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invitation expired', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        expires_at: new Date(Date.now() - 1000), // 1 second in the past
      };
      mockInvitationRepository.findOne.mockResolvedValue(expiredInvitation);

      await expect(service.findByToken('abc123def456')).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(mockInvitation);
      const acceptedInvitation = { ...mockInvitation, status: InvitationStatus.ACCEPTED };
      mockInvitationRepository.save.mockResolvedValue(acceptedInvitation);

      const result = await service.acceptInvitation('abc123def456', 'user-1');

      expect(result.status).toBe(InvitationStatus.ACCEPTED);
      expect(mockInvitationRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptInvitation('invalid-token', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if invitation expired', async () => {
      const expiredInvitation = {
        ...mockInvitation,
        expires_at: new Date(Date.now() - 1000),
      };
      mockInvitationRepository.findOne.mockResolvedValue(expiredInvitation);

      await expect(service.acceptInvitation('abc123def456', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectInvitation', () => {
    it('should reject invitation', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(mockInvitation);
      const rejectedInvitation = { ...mockInvitation, status: InvitationStatus.REJECTED };
      mockInvitationRepository.save.mockResolvedValue(rejectedInvitation);

      const result = await service.rejectInvitation('abc123def456');

      expect(result.status).toBe(InvitationStatus.REJECTED);
      expect(mockInvitationRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockInvitationRepository.findOne.mockResolvedValue(null);

      await expect(service.rejectInvitation('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });
});
