import { Test, TestingModule } from '@nestjs/testing';
import { AvaliacaoService } from './avaliacao.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AvaliacaoService', () => {
  let service: AvaliacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvaliacaoService,
        {
          provide: PrismaService,
          useValue: {
            avaliacao: {
              count: jest.fn(),
              aggregate: jest.fn(),
              groupBy: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AvaliacaoService>(AvaliacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
