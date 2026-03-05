import { Test, TestingModule } from '@nestjs/testing';
import { TimetableOptimizerService } from './timetable-optimizer.service';

describe('TimetableOptimizerService', () => {
  let service: TimetableOptimizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimetableOptimizerService],
    }).compile();

    service = module.get<TimetableOptimizerService>(TimetableOptimizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
