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
    it('deve retornar métricas agregadas de BI para o período todos, incluindo balanço de massa e auditoria climática', async () => {
      prisma.producao.aggregate.mockResolvedValue({
        _sum: {
          farinhaKg: 1000,
          fermentoGrama: 8500,
          emulsificanteMl: 5000,
        },
        _avg: {
          farinhaKg: 25,
          fermentoGrama: 212.5,
          tempoFermentacaoMinutos: 180,
        },
      });

      prisma.producao.count.mockResolvedValue(40);

      // findMany mock:
      // 1ª chamada: producoesRecentes (gráfico 6 meses)
      // 2ª chamada: producoesPeriodo
      prisma.producao.findMany
        .mockResolvedValueOnce([
          {
            dataProducao: new Date().toISOString(),
            farinhaKg: 25,
          },
        ])
        .mockResolvedValueOnce([
          // Fornada 1: Nota 5, Clima Ameno (22°C), dosagem 8.5 g/kg (212.5g / 25kg)
          {
            id: 1,
            farinhaKg: 25,
            fermentoGrama: 212.5,
            tempAmbienteInicial: 21,
            tempAmbienteFinal: 23,
            tempoFermentacaoMinutos: 180,
            avaliacao: { nota: 5 },
          },
          // Fornada 2: Nota 4, Clima Ameno (24°C), dosagem 8.6 g/kg (aderente ao clima)
          {
            id: 2,
            farinhaKg: 25,
            fermentoGrama: 215,
            tempAmbienteInicial: 23,
            tempAmbienteFinal: 25,
            tempoFermentacaoMinutos: 190,
            avaliacao: { nota: 4 },
          },
          // Fornada 3: Nota 3, Clima Ameno (22°C), dosagem 12 g/kg (descalibrado, fora de 8.5 +-10%)
          {
            id: 3,
            farinhaKg: 25,
            fermentoGrama: 300,
            tempAmbienteInicial: 20,
            tempAmbienteFinal: 24,
            tempoFermentacaoMinutos: 170,
            avaliacao: { nota: 3 },
          },
          // Fornada 4: Sem avaliação (EDGE CASE 3: avaliação pendente)
          {
            id: 4,
            farinhaKg: 25,
            fermentoGrama: 212.5,
            tempAmbienteInicial: 20,
            tempAmbienteFinal: 26, // Delta T = 6 (oscilação)
            tempoFermentacaoMinutos: 180,
            avaliacao: null,
          },
        ]);

      const result = await service.getBiStats('todos');

      expect(result).toHaveProperty('periodo', 'todos');
      expect(result.totalFarinhaKg).toBe(1000);
      expect(result.totalFermentoGrama).toBe(8500);
      expect(result.totalEmulsificanteMl).toBe(5000);
      expect(result.totalFornadas).toBe(40);
      expect(result.tempoMedioMinutos).toBe(180);
      expect(result.mediaFarinhaPorFornada).toBe(25);
      expect(result.proporcaoFermentoGramaPorKg).toBe(8.5);

      // Balanço de massa (3 Cenários)
      expect(result.balancoMassa.cenarioFarinha.paesEstimadosTotal).toBe(21250); // 1000 * 21.25
      expect(result.balancoMassa.cenarioFarinha.paesEstimadosPorFornada).toBe(531); // 25 * 21.25 = 531.25 -> 531
      expect(result.balancoMassa.cenarioMassaCrua.massaCruaTotalKg).toBe(1505); // 1000 * 1.505
      expect(result.balancoMassa.cenarioPaoAssado.paoAssadoTotalKg).toBe(1168.75); // 1000 * 1.16875
      expect(result.balancoMassa.cenarioPaoAssado.taxaQuebraEvaporacao).toBe(22.3);

      // Auditoria Climática (Opção B)
      expect(result.auditoriaClima.totalAderente).toBe(3); // fornadas 1, 2 e 4 (8.5 e 8.6 g/kg)
      expect(result.auditoriaClima.totalDescalibrado).toBe(1); // fornada 3 (12 g/kg)
      expect(result.auditoriaClima.taxaAderenciaIdeal).toBe(75); // 3 de 4 = 75%
      expect(result.auditoriaClima.notaMediaAderente).toBe(4.5); // (5 + 4) / 2 avaliadas = 4.5 (fornada 4 sem nota ignorada no denominador)
      expect(result.auditoriaClima.notaMediaDescalibrado).toBe(3); // fornada 3 nota 3

      // Sensibilidade Térmica e Zona de Ouro
      expect(result.sensibilidadeTermica.estavel.total).toBe(3); // Delta T <= 4
      expect(result.sensibilidadeTermica.oscilacao.total).toBe(1); // Delta T = 6 > 4
      expect(result.zonaDeOuro.totalNota5).toBe(1);
      expect(result.zonaDeOuro.tempoMedioMinutos).toBe(180);
    });

    it('deve calcular tendência de farinha e tratar fallback de clima quando periodo for mes', async () => {
      prisma.producao.aggregate
        .mockResolvedValueOnce({
          _sum: {
            farinhaKg: 1200,
            fermentoGrama: 10200,
            emulsificanteMl: 6000,
          },
          _avg: {
            farinhaKg: 30,
            fermentoGrama: 255,
            tempoFermentacaoMinutos: 190,
          },
        })
        .mockResolvedValueOnce({
          _sum: {
            farinhaKg: 1000, // mês anterior
          },
        });

      prisma.producao.count.mockResolvedValue(40);
      prisma.producao.findMany
        .mockResolvedValueOnce([]) // producoesRecentes
        .mockResolvedValueOnce([
          // producoesPeriodo do mês atual (apenas clima ameno e sem nenhuma nota 5 em frio)
          {
            id: 10,
            farinhaKg: 30,
            fermentoGrama: 255,
            tempAmbienteInicial: 22,
            tempAmbienteFinal: 24,
            tempoFermentacaoMinutos: 190,
            avaliacao: { nota: 4 },
          },
        ])
        .mockResolvedValueOnce([
          // producoesNota5Global (EDGE CASE 1: fallback global para a faixa fria)
          {
            farinhaKg: 40,
            fermentoGrama: 400, // 10 g/kg em clima frio histórico
            tempAmbienteInicial: 15,
            tempAmbienteFinal: 17,
            tempoFermentacaoMinutos: 200,
          },
        ]);

      const result = await service.getBiStats('mes');

      expect(result).toHaveProperty('periodo', 'mes');
      expect(result.totalFarinhaKg).toBe(1200);
      expect(result.tendenciaFarinha).toBe(20); // (1200 - 1000) / 1000 * 100 = +20%
      // Faixa fria usou fallback global histórico de 10 g/kg
      expect(result.auditoriaClima.faixasReferencia.frio.usouFallback).toBe(true);
      expect(result.auditoriaClima.faixasReferencia.frio.dosagemMediaNota5).toBe(10);
    });
  });
});
