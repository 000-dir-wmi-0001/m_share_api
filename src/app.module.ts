import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './database/config';
import { User } from './common/entities';
import {
  UsersModule,
  TeamsModule,
  TeamMembersModule,
  TeamInvitationsModule,
  ProjectsModule,
  ProjectItemsModule,
  ProjectFilesModule,
  ProjectAccessModule,
  ActivitiesModule,
  DonationsModule,
  SponsorshipsModule,
  AuthModule,
  SearchModule,
  NotificationsModule,
  AnalyticsModule,
  SettingsModule,
} from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),
    TypeOrmModule.forFeature([User]),
    UsersModule,
    AuthModule,
    TeamsModule,
    TeamMembersModule,
    TeamInvitationsModule,
    ProjectsModule,
    ProjectItemsModule,
    ProjectFilesModule,
    ProjectAccessModule,
    ActivitiesModule,
    DonationsModule,
    SponsorshipsModule,
    SearchModule,
    NotificationsModule,
    AnalyticsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
