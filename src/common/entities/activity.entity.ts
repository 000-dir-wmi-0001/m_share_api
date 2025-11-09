import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ActivityType } from '../enums';
import { User } from './user.entity';
import { Team } from './team.entity';
import { Project } from './project.entity';

@Entity('activities')
@Index(['user_id'])
@Index(['team_id'])
@Index(['project_id'])
@Index(['type'])
@Index(['created_at'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  team_id: string;

  @Column({ type: 'uuid', nullable: true })
  project_id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column({ type: 'varchar', length: 255 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => User, (user) => user.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Team, (team) => team.activities, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => Project, (project) => project.activities, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
