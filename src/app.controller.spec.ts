import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockUserRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health status', async () => {
      const result = await appController.getHealth();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('root', () => {
    it('should return API information', async () => {
      const result = await appController.getRoot();
      expect(result).toHaveProperty('api');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('running');
    });
  });
});
