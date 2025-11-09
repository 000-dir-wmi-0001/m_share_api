import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectAccess } from '../../common/entities';
import { ProjectAccessService } from './project-access.service';
import { ProjectAccessController } from './project-access.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectAccess])],
  providers: [ProjectAccessService],
  controllers: [ProjectAccessController],
  exports: [ProjectAccessService],
})
export class ProjectAccessModule {}
