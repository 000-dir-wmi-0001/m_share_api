import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Team } from './team.entity';

@Entity('team_settings')
@Index(['team_id'])
export class TeamSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  team_id: string;

  @Column({ type: 'boolean', default: false })
  public_team: boolean;

  @Column({ type: 'boolean', default: true })
  members_can_invite: boolean;

  @Column({ type: 'boolean', default: true })
  members_can_create_projects: boolean;

  @Column({ type: 'boolean', default: false })
  members_can_delete_projects: boolean;

  @Column({ type: 'boolean', default: true })
  allow_public_sharing: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  default_member_role: string;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
