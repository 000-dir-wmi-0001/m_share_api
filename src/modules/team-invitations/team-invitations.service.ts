import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamInvitation } from '../../common/entities';
import { InvitationStatus } from '../../common/enums';
import * as crypto from 'crypto';

@Injectable()
export class TeamInvitationsService {
  constructor(
    @InjectRepository(TeamInvitation)
    private invitationsRepository: Repository<TeamInvitation>,
  ) {}

  async createInvitation(data: {
    team_id: string;
    email: string;
    role: string;
    invited_by_id: string;
  }): Promise<any> {
    // Check if invitation already exists
    const existingInvitation = await this.invitationsRepository.findOne({
      where: { team_id: data.team_id, email: data.email, status: InvitationStatus.PENDING },
    });

    if (existingInvitation) {
      throw new BadRequestException('Invitation already sent to this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

    const invitation = this.invitationsRepository.create({
      team_id: data.team_id,
      email: data.email,
      role: data.role,
      token,
      status: InvitationStatus.PENDING,
      expires_at: expiresAt,
      invited_by_id: data.invited_by_id,
    });

    const savedInvitation = await this.invitationsRepository.save(invitation);
    return this.formatInvitationResponse(savedInvitation);
  }

  async findTeamInvitations(teamId: string, limit: number = 20, offset: number = 0) {
    const [invitations, total] = await this.invitationsRepository.findAndCount({
      where: { team_id: teamId },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: invitations.map(i => this.formatInvitationResponse(i)),
      total,
    };
  }

  async findByToken(token: string): Promise<any> {
    const invitation = await this.invitationsRepository.findOne({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if expired
    if (new Date() > invitation.expires_at) {
      throw new BadRequestException('Invitation has expired');
    }

    return this.formatInvitationResponse(invitation);
  }

  async acceptInvitation(token: string, userId: string): Promise<any> {
    const invitation = await this.invitationsRepository.findOne({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (new Date() > invitation.expires_at) {
      throw new BadRequestException('Invitation has expired');
    }

    invitation.status = InvitationStatus.ACCEPTED;
    const updatedInvitation = await this.invitationsRepository.save(invitation);
    return this.formatInvitationResponse(updatedInvitation);
  }

  async rejectInvitation(token: string): Promise<any> {
    const invitation = await this.invitationsRepository.findOne({ where: { token } });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.REJECTED;
    const updatedInvitation = await this.invitationsRepository.save(invitation);
    return this.formatInvitationResponse(updatedInvitation);
  }

  async remove(id: string): Promise<void> {
    await this.invitationsRepository.delete(id);
  }

  private formatInvitationResponse(invitation: TeamInvitation): any {
    return invitation;
  }
}
