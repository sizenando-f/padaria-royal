import { Test, TestingModule } from '@nestjs/testing';
import { ProducaoService } from './producao.service';

describe('ProducaoService', () => {
  let service: ProducaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProducaoService],
    }).compile();

    service = module.get<ProducaoService>(ProducaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
