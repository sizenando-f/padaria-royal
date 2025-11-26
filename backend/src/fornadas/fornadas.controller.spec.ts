import { Test, TestingModule } from '@nestjs/testing';
import { FornadasController } from './fornadas.controller';
import { FornadasService } from './fornadas.service';

describe('FornadasController', () => {
  let controller: FornadasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FornadasController],
      providers: [FornadasService],
    }).compile();

    controller = module.get<FornadasController>(FornadasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
