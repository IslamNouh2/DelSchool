import { Test, TestingModule } from '@nestjs/testing';
import { TransitionController } from './transition.controller';

describe('TransitionController', () => {
  let controller: TransitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransitionController],
    }).compile();

    controller = module.get<TransitionController>(TransitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
