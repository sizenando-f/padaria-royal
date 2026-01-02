import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProducaoModule } from './producao/producao.module';
import { AvaliacaoModule } from './avaliacao/avaliacao.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    PrismaModule, 
    ProducaoModule, 
    AvaliacaoModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
