import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team, User } from '../../common/entities';
import { CreateTeamDto, UpdateTeamDto, TeamResponseDto } from '../../common/dtos';
import { TeamStatus } from '../../common/enums';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
  ) {}

  async create(createTeamDto: CreateTeamDto, userId: string): Promise<TeamResponseDto> {
    const { name, description, is_private } = createTeamDto;

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    // Check if slug already exists
    const existingTeam = await this.teamsRepository.findOne({ where: { slug } });
    if (existingTeam) {
      throw new BadRequestException('Team name already exists');
    }

    const team = this.teamsRepository.create({
      name,
      description,
      slug,
      owner_id: userId,
      is_private,
      status: TeamStatus.ACTIVE,
      member_count: 1,
      project_count: 0,
    });

    const savedTeam = await this.teamsRepository.save(team);
    return this.formatTeamResponse(savedTeam);
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<{ data: TeamResponseDto[]; total: number }> {
    const [teams, total] = await this.teamsRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: teams.map(team => this.formatTeamResponse(team)),
      total,
    };
  }

  async findOne(id: string): Promise<TeamResponseDto> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.formatTeamResponse(team);
  }

  async findBySlug(slug: string): Promise<TeamResponseDto> {
    const team = await this.teamsRepository.findOne({
      where: { slug },
      relations: ['owner'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.formatTeamResponse(team);
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, userId: string): Promise<TeamResponseDto> {
    const team = await this.teamsRepository.findOne({ where: { id } });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if user is owner
    if (team.owner_id !== userId) {
      throw new ForbiddenException('Only team owner can update team');
    }

    Object.assign(team, updateTeamDto);
    const updatedTeam = await this.teamsRepository.save(team);

    return this.formatTeamResponse(updatedTeam);
  }

  async remove(id: string, userId: string): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id } });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if user is owner
    if (team.owner_id !== userId) {
      throw new ForbiddenException('Only team owner can delete team');
    }

    await this.teamsRepository.remove(team);
  }

  async incrementMemberCount(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (team) {
      team.member_count = (team.member_count || 0) + 1;
      await this.teamsRepository.save(team);
    }
  }

  async decrementMemberCount(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (team && team.member_count > 0) {
      team.member_count -= 1;
      await this.teamsRepository.save(team);
    }
  }

  async incrementProjectCount(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (team) {
      team.project_count = (team.project_count || 0) + 1;
      await this.teamsRepository.save(team);
    }
  }

  async decrementProjectCount(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (team && team.project_count > 0) {
      team.project_count -= 1;
      await this.teamsRepository.save(team);
    }
  }

  private formatTeamResponse(team: Team): TeamResponseDto {
    return team as TeamResponseDto;
  }

  async getTeamStats(teamId: string): Promise<{
    teamId: string;
    name: string;
    memberCount: number;
    projectCount: number;
    createdAt: Date;
    status: string;
  }> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return {
      teamId: team.id,
      name: team.name,
      memberCount: team.member_count || 0,
      projectCount: team.project_count || 0,
      createdAt: team.created_at,
      status: team.status,
    };
  }
}
