import { DataSourceOptions } from 'typeorm';
import {
  User,
  Project,
  ProjectItem,
  Activity,
  Donation,
  Sponsorship,
} from './common/entities';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.PGHOST,
  port: 5432,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  entities: [
    User,
    Project,
    ProjectItem,
    Activity,
    Donation,
    Sponsorship,
  ],
  synchronize: true,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
};
