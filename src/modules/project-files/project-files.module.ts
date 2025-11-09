import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectFile, FileVersion } from '../../common/entities';
import { ProjectFilesService } from './project-files.service';
import { ProjectFilesController } from './project-files.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectFile, FileVersion])],
  providers: [ProjectFilesService],
  controllers: [ProjectFilesController],
  exports: [ProjectFilesService],
})
export class ProjectFilesModule {}
