import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectFile } from './project-file.entity';
import { User } from './user.entity';

@Entity('file_versions')
@Index(['file_id'])
@Index(['uploaded_by_id'])
@Index(['created_at'])
export class FileVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  file_id: string;

  @Column({ type: 'uuid' })
  uploaded_by_id: string;

  @Column({ type: 'integer' })
  version_number: number;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'text', nullable: true })
  change_note: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => ProjectFile, (file) => file.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'file_id' })
  file: ProjectFile;

  @ManyToOne(() => User, (user) => user.file_versions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploaded_by: User;
}
