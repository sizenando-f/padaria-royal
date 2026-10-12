import { Test, TestingModule } from '@nestjs/testing';
import { ProducaoService } from './producao.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('ProducaoService', () => {
  let service: ProducaoService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      producao: {
        aggregate: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducaoService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('America/Campo_Grande'),
          },
        },
      ],
    }).compile();

    service = module.get<ProducaoService>(ProducaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBiStats', () => {
    it('deve retornar métricas agregadas de BI para o período todos', async () => {
      prisma.producao.aggregate.mockResolvedValue({
        _sum: {
          farinhaKg: 1000,
          fermentoGrama: 20000,
          emulsificanteMl: 5000,
        },
        _avg: {
          farinhaKg: 25,
          fermentoGrama: 500,
          tempoFermentacaoMinutos: 180,
        },
      });

      prisma.producao.count.mockResolvedValue(40);
      prisma.producao.findMany.mockResolvedValue([
        {
          dataProducao: new Date().toISOString(),
          farinhaKg: 25,
        },
      ]);

      const result = await service.getBiStats('todos');

      expect(result).toHaveProperty('periodo', 'todos');
      expect(result.totalFarinhaKg).toBe(1000);
      expect(result.totalFermentoGrama).toBe(20000);
      expect(result.totalEmulsificanteMl).toBe(5000);
      expect(result.totalFornadas).toBe(40);
      expect(result.tempoMedioMinutos).toBe(180);
      expect(result.mediaFarinhaPorFornada).toBe(25);
      expect(result.proporcaoFermentoGramaPorKg).toBe(20);
      expect(result.tendenciaFarinha).toBeNull();
      expect(Array.isArray(result.evolucaoFarinha)).toBe(true);
    });

    it('deve calcular tendência de farinha quando periodo for mes', async () => {
      prisma.producao.aggregate
        .mockResolvedValueOnce({
          _sum: {
            farinhaKg: 1200,
            fermentoGrama: 24000,
            emulsificanteMl: 6000,
          },
          _avg: {
            farinhaKg: 30,
            fermentoGrama: 600,
            tempoFermentacaoMinutos: 190,
          },
        })
        .mockResolvedValueOnce({
          _sum: {
            farinhaKg: 1000, // mês anterior
          },
        });

      prisma.producao.count.mockResolvedValue(40);
      prisma.producao.findMany.mockResolvedValue([]);

      const result = await service.getBiStats('mes');

      expect(result).toHaveProperty('periodo', 'mes');
      expect(result.totalFarinhaKg).toBe(1200);
      expect(result.tendenciaFarinha).toBe(20); // (1200 - 1000) / 1000 * 100 = +20%
    });
  });
});
