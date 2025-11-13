import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectFile, FileVersion } from '../../common/entities';
import { ProjectFilesService } from './project-files.service';
import { ProjectFilesController } from './project-files.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectFile, FileVersion]), StorageModule],
  providers: [ProjectFilesService],
  controllers: [ProjectFilesController],
  exports: [ProjectFilesService],
})
export class ProjectFilesModule {}
