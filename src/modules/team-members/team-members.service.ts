import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from '../../common/entities';
import { AddTeamMemberDto, UpdateTeamMemberDto, TeamMemberResponseDto } from '../../common/dtos';
import { MemberStatus } from '../../common/enums';

@Injectable()
export class TeamMembersService {
  constructor(
    @InjectRepository(TeamMember)
    private teamMembersRepository: Repository<TeamMember>,
  ) {}

  async addMember(teamId: string, addMemberDto: AddTeamMemberDto, userId: string): Promise<TeamMemberResponseDto> {
    const { user_id, role } = addMemberDto;

    const member = this.teamMembersRepository.create({
      team_id: teamId,
      user_id,
      role,
      status: MemberStatus.ACTIVE,
      joined_at: new Date(),
    });

    const savedMember = await this.teamMembersRepository.save(member);
    return this.formatMemberResponse(savedMember);
  }

  async findTeamMembers(teamId: string, limit: number = 10, offset: number = 0) {
    const [members, total] = await this.teamMembersRepository.findAndCount({
      where: { team_id: teamId },
      take: limit,
      skip: offset,
      order: { joined_at: 'DESC' },
    });

    return {
      data: members.map(m => this.formatMemberResponse(m)),
      total,
    };
  }

  async findOne(id: string): Promise<TeamMemberResponseDto> {
    const member = await this.teamMembersRepository.findOne({ where: { id } });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return this.formatMemberResponse(member);
  }

  async updateRole(id: string, updateDto: UpdateTeamMemberDto, userId: string): Promise<TeamMemberResponseDto> {
    const member = await this.teamMembersRepository.findOne({ where: { id } });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    Object.assign(member, updateDto);
    member.updated_at = new Date();

    const updatedMember = await this.teamMembersRepository.save(member);
    return this.formatMemberResponse(updatedMember);
  }

  async removeMember(id: string, userId: string): Promise<void> {
    const member = await this.teamMembersRepository.findOne({ where: { id } });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    await this.teamMembersRepository.remove(member);
  }

  async leaveteam(teamId: string, userId: string): Promise<void> {
    const member = await this.teamMembersRepository.findOne({
      where: { team_id: teamId, user_id: userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this team');
    }

    // TODO: Handle role transitions (if user is owner, transfer to another member or delete team)
    await this.teamMembersRepository.remove(member);
  }

  private formatMemberResponse(member: TeamMember): TeamMemberResponseDto {
    return member as TeamMemberResponseDto;
  }
}
