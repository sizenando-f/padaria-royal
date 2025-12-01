import { Test, TestingModule } from '@nestjs/testing';
import { ProducaoController } from './producao.controller';
import { ProducaoService } from './producao.service';

describe('ProducaoController', () => {
  let controller: ProducaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProducaoController],
      providers: [ProducaoService],
    }).compile();

    controller = module.get<ProducaoController>(ProducaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
