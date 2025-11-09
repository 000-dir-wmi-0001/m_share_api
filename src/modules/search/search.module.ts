import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Project, ProjectFile, User, Team } from '../../common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectFile, User, Team])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
