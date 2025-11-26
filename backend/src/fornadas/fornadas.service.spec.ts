import { Test, TestingModule } from '@nestjs/testing';
import { FornadasService } from './fornadas.service';

describe('FornadasService', () => {
  let service: FornadasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FornadasService],
    }).compile();

    service = module.get<FornadasService>(FornadasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
