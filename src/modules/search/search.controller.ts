import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Global search',
    description: 'Search across projects, files, users, and teams',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query (min 2 characters)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Results to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved',
    schema: {
      example: {
        projects: [],
        files: [],
        users: [],
        teams: [],
        total: 0,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Query too short' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Search projects',
    description: 'Search for projects by name or description',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query (min 2 characters)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Results to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Project search results',
  })
  @ApiResponse({ status: 400, description: 'Query too short' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Search files',
    description: 'Search for files by name or within a project',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query (min 2 characters)',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: String,
    description: 'Filter by project ID (optional)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Results to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'File search results',
  })
  @ApiResponse({ status: 400, description: 'Query too short' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Search users',
    description: 'Search for users by name or email',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query (min 2 characters)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Results to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'User search results',
  })
  @ApiResponse({ status: 400, description: 'Query too short' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
}
