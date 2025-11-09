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
import { ProjectStatus, Visibility } from '../enums';
import { User } from './user.entity';
import { Team } from './team.entity';
import { ProjectItem } from './project-item.entity';
import { ProjectAccess } from './project-access.entity';
import { Activity } from './activity.entity';
import { ProjectFile } from './project-file.entity';

@Entity('projects')
@Index(['owner_id'])
@Index(['team_id'])
@Index(['slug'], { unique: true })
@Index(['created_at'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @Column({ type: 'uuid', nullable: true })
  team_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: Visibility,
    default: Visibility.PRIVATE,
  })
  visibility: Visibility;

  @Column({ type: 'boolean', default: false })
  is_password_protected: boolean;

  @Column({ type: 'varchar', nullable: true })
  password_hash: string;

  @Column({ type: 'integer', default: 0 })
  member_count: number;

  @Column({ type: 'integer', default: 0 })
  item_count: number;

  @Column({ type: 'integer', default: 0 })
  share_count: number;

  @Column({ type: 'integer', default: 0 })
  view_count: number;

  @Column({ type: 'integer', default: 0 })
  copy_count: number;

  @Column({ type: 'bigint', default: 0 })
  storage_used: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Team, (team) => team.projects, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @OneToMany(() => ProjectItem, (item) => item.project)
  items: ProjectItem[];

  @OneToMany(() => ProjectFile, (file) => file.project)
  files: ProjectFile[];

  @OneToMany(() => ProjectAccess, (access) => access.project)
  access_permissions: ProjectAccess[];

  @OneToMany(() => Activity, (activity) => activity.project)
  activities: Activity[];
}
