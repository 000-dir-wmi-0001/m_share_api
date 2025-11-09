import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectItem } from '../../common/entities';
import { ProjectItemsService } from './project-items.service';
import { ProjectItemsController } from './project-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectItem])],
  providers: [ProjectItemsService],
  controllers: [ProjectItemsController],
  exports: [ProjectItemsService],
})
export class ProjectItemsModule {}
