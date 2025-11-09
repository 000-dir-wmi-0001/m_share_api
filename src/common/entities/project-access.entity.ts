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
import { AccessType } from '../enums';
import { Project } from './project.entity';
import { User } from './user.entity';

@Entity('project_access')
@Index(['project_id'])
@Index(['user_id'])
@Index(['token'], { unique: true })
@Index(['created_at'])
export class ProjectAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({
    type: 'enum',
    enum: AccessType,
    default: AccessType.VIEW,
  })
  access_type: AccessType;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  token: string;

  @Column({ type: 'boolean', default: false })
  is_password_protected: boolean;

  @Column({ type: 'varchar', nullable: true })
  password_hash: string;

  @Column({ type: 'boolean', default: false })
  allow_download: boolean;

  @Column({ type: 'boolean', default: false })
  allow_share: boolean;

  @Column({ type: 'boolean', default: true })
  allow_view_notifications: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'integer', default: 0 })
  view_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => Project, (project) => project.access_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
