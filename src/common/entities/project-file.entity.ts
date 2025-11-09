import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { FileVersion } from './file-version.entity';

@Entity('project_files')
@Index(['project_id'])
@Index(['uploaded_by_id'])
@Index(['created_at'])
export class ProjectFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'uuid' })
  uploaded_by_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  folder: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  file_extension: string;

  @Column({ type: 'integer', default: 1 })
  version_number: number;

  @Column({ type: 'boolean', default: true })
  is_latest_version: boolean;

  @Column({ type: 'integer', default: 0 })
  download_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => Project, (project) => project.files, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, (user) => user.uploaded_files, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by: User;

  @OneToMany(() => FileVersion, (version) => version.file, {
    cascade: true,
  })
  versions: FileVersion[];
}
