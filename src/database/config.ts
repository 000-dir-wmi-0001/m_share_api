import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  User,
  Team,
  TeamMember,
  TeamInvitation,
  Project,
  ProjectItem,
  ProjectAccess,
  Activity,
  Donation,
  Sponsorship,
  ProjectFile,
  FileVersion,
  Notification,
  UserSetting,
  TeamSetting,
} from '../common/entities';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const databaseUrl = configService.get('DATABASE_URL');

  // Parse DATABASE_URL if provided (for Neon PostgreSQL)
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [
          // User Management
          User,
          UserSetting,

          // Team Management
          Team,
          TeamMember,
          TeamInvitation,
          TeamSetting,

          // Project Management
          Project,
          ProjectItem,
          ProjectFile,
          FileVersion,
          ProjectAccess,

          // Activity & Tracking
          Activity,

          // Notifications
          Notification,

          // Additional Features
          Donation,
          Sponsorship,
        ],
        synchronize: true, // Enable auto-schema sync in development
        logging: !isProduction, // Enable logging in development
        ssl: { rejectUnauthorized: false }, // SSL required for Neon
        poolSize: 10,
        maxQueryExecutionTime: 1000, // milliseconds
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: false, // Manual migration control
      };
    } catch (error) {
      console.error('Invalid DATABASE_URL format:', error);
    }
  }

  // Fallback to individual config variables
  return {
    type: 'postgres',
    host: configService.get('PGHOST') || 'localhost',
    port: parseInt(configService.get('PGPORT') || '5432', 10),
    username: configService.get('PGUSER') || 'postgres',
    password: configService.get('PGPASSWORD') || 'password',
    database: configService.get('PGDATABASE') || 'm_share',
    entities: [
      // User Management
      User,
      UserSetting,

      // Team Management
      Team,
      TeamMember,
      TeamInvitation,
      TeamSetting,

      // Project Management
      Project,
      ProjectItem,
      ProjectFile,
      FileVersion,
      ProjectAccess,

      // Activity & Tracking
      Activity,

      // Notifications
      Notification,

      // Additional Features
      Donation,
      Sponsorship,
    ],
    synchronize: false, // Disabled due to schema conflicts - manual cleanup needed
    logging: !isProduction, // Enable logging in development
    ssl: !isProduction ? false : { rejectUnauthorized: false }, // SSL only in production
    poolSize: 10,
    maxQueryExecutionTime: 1000, // milliseconds
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false, // Manual migration control
  };
};
