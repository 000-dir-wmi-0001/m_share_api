import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Tree,
  TreeParent,
  TreeChildren,
} from 'typeorm';
import { FileType } from '../enums';
import { Project } from './project.entity';

@Entity('project_items')
@Tree('materialized-path')
@Index(['project_id'])
@Index(['created_at'])
@Index(['project_id', 'mpath'])
export class ProjectItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  file_type: FileType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  path: string;

  @Column({ type: 'boolean', default: false })
  is_folder: boolean;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false })
  is_watermarked: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  language: string;

  @Column({ type: 'integer', default: 0 })
  view_count: number;

  @Column({ type: 'integer', default: 0 })
  copy_count: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  b2_file_id: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  b2_url: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => Project, (project) => project.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @TreeParent()
  parent: ProjectItem;

  @TreeChildren()
  children: ProjectItem[];
}
