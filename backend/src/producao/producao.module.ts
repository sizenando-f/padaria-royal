import { Module } from '@nestjs/common';
import { ProducaoService } from './producao.service';
import { ProducaoController } from './producao.controller';

@Module({
  controllers: [ProducaoController],
  providers: [ProducaoService],
})
export class ProducaoModule {}
