import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProducaoModule } from './producao/producao.module';
import { AvaliacaoModule } from './avaliacao/avaliacao.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BackupModule } from './backup/backup.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // Para o .env ficar disponível em todo sistema
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProducaoModule,
    AvaliacaoModule,
    AuthModule,
    BackupModule,
    UsuarioModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
