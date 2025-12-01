import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProducaoModule } from './producao/producao.module';

@Module({
  imports: [PrismaModule, ProducaoModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
