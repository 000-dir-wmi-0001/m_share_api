import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  async getRoot() {
    return {
      api: 'M-Share Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        users: '/users',
        teams: '/teams',
        projects: '/projects',
        activities: '/activities',
        donations: '/donations',
        sponsorships: '/sponsorships',
      },
      documentation: 'See README.md for API documentation',
    };
  }
}
