import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserStatus } from '../enums';
import { TeamMember } from './team-member.entity';
import { Project } from './project.entity';
import { Activity } from './activity.entity';
import { Donation } from './donation.entity';
import { ProjectFile } from './project-file.entity';
import { FileVersion } from './file-version.entity';
import { Notification } from './notification.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['created_at'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  @Exclude()
  password_hash: string;

  @Column({ type: 'text', nullable: true })
  avatar_url: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'boolean', default: false })
  two_factor_enabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  two_factor_secret: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  // Relations
  @OneToMany(() => TeamMember, (teamMember) => teamMember.user)
  team_memberships: TeamMember[];

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => ProjectFile, (file) => file.uploaded_by)
  uploaded_files: ProjectFile[];

  @OneToMany(() => FileVersion, (version) => version.uploaded_by)
  file_versions: FileVersion[];

  @OneToMany(() => Activity, (activity) => activity.user)
  activities: Activity[];

  @OneToMany(() => Donation, (donation) => donation.user)
  donations: Donation[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
