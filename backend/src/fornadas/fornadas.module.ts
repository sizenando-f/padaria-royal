import { Module } from '@nestjs/common';
import { FornadasService } from './fornadas.service';
import { FornadasController } from './fornadas.controller';

@Module({
  controllers: [FornadasController],
  providers: [FornadasService],
})
export class FornadasModule {}
