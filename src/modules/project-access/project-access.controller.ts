import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectAccessService } from './project-access.service';

@Controller('projects/:projectId/access')
export class ProjectAccessController {
  constructor(private readonly projectAccessService: ProjectAccessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async grantAccess(
    @Param('projectId') projectId: string,
    @Body() grantAccessDto: any,
  ) {
    return this.projectAccessService.grantAccess({
      ...grantAccessDto,
      project_id: projectId,
    });
  }

  @Get()
  async findProjectAccess(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.projectAccessService.findProjectAccess(projectId, limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectAccessService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAccessDto: any,
  ) {
    return this.projectAccessService.update(id, updateAccessDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectAccessService.remove(id);
  }
}
