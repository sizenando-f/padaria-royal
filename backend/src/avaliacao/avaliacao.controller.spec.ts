import { Test, TestingModule } from '@nestjs/testing';
import { AvaliacaoController } from './avaliacao.controller';
import { AvaliacaoService } from './avaliacao.service';
import { BackupService } from 'src/backup/backup.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AvaliacaoController', () => {
  let controller: AvaliacaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvaliacaoController],
      providers: [
        { provide: AvaliacaoService, useValue: {} },
        { provide: BackupService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AvaliacaoController>(AvaliacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
