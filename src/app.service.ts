import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './common/entities';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getHealth() {
    try {
      // Test database connection
      await this.userRepository.count();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        message: 'API is running and database connection is active',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }
}
