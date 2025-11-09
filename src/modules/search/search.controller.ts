import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async globalSearch(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
    @Request() req: any,
  ) {
    if (!query || query.length < 2) {
      return { projects: [], files: [], users: [], teams: [], total: 0 };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.searchService.globalSearch(query, limit, offset);
  }

  @Get('projects')
  @UseGuards(JwtAuthGuard)
  async searchProjects(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
    @Request() req: any,
  ) {
    if (!query || query.length < 2) {
      return { data: [], total: 0 };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.searchService.searchProjects(query, limit, offset, userId);
  }

  @Get('files')
  @UseGuards(JwtAuthGuard)
  async searchFiles(
    @Query('q') query: string,
    @Query('projectId') projectId?: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    if (!query || query.length < 2) {
      return { data: [], total: 0 };
    }
    return this.searchService.searchFiles(query, limit, offset, projectId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    if (!query || query.length < 2) {
      return { data: [], total: 0 };
    }
    return this.searchService.searchUsers(query, limit, offset);
  }

  @Get('teams')
  @UseGuards(JwtAuthGuard)
  async searchTeams(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    if (!query || query.length < 2) {
      return { data: [], total: 0 };
    }
    return this.searchService.searchTeams(query, limit, offset);
  }
}
