import { Test, TestingModule } from '@nestjs/testing';
import { ProducaoController } from './producao.controller';
import { ProducaoService } from './producao.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('ProducaoController', () => {
  let controller: ProducaoController;
  let producaoService: any;

  beforeEach(async () => {
    producaoService = {
      getBiStats: jest.fn().mockResolvedValue({
        periodo: 'todos',
        totalFarinhaKg: 1000,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProducaoController],
      providers: [
        { provide: ProducaoService, useValue: producaoService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ProducaoController>(ProducaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('deve chamar getBiStats com sucesso quando usuário for GERENTE', async () => {
    const req = { user: { cargo: 'GERENTE' } };
    const res = await controller.getBiStats('todos', req);
    expect(producaoService.getBiStats).toHaveBeenCalledWith('todos');
    expect(res).toEqual({ periodo: 'todos', totalFarinhaKg: 1000 });
  });

  it('deve lançar UnauthorizedException se usuário não for GERENTE', async () => {
    const req = { user: { cargo: 'PADEIRO' } };
    await expect(controller.getBiStats('todos', req)).rejects.toThrow('Acesso restrito a gerentes.');
  });
});
