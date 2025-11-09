import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TeamStatus } from '../enums';
import { User } from './user.entity';
import { TeamMember } from './team-member.entity';
import { Project } from './project.entity';
import { TeamInvitation } from './team-invitation.entity';
import { Activity } from './activity.entity';

@Entity('teams')
@Index(['owner_id'])
@Index(['created_at'])
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  slug: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @Column({
    type: 'enum',
    enum: TeamStatus,
    default: TeamStatus.ACTIVE,
  })
  status: TeamStatus;

  @Column({ type: 'boolean', default: false })
  is_private: boolean;

  @Column({ type: 'integer', default: 0 })
  member_count: number;

  @Column({ type: 'integer', default: 0 })
  project_count: number;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => TeamMember, (teamMember) => teamMember.team)
  members: TeamMember[];

  @OneToMany(() => TeamInvitation, (invitation) => invitation.team)
  invitations: TeamInvitation[];

  @OneToMany(() => Project, (project) => project.team)
  projects: Project[];

  @OneToMany(() => Activity, (activity) => activity.team)
  activities: Activity[];
}
