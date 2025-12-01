import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';  // Importa

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativa a validação global para o DTO
  app.useGlobalPipes(new ValidationPipe({
    transform: true,      // Converte tipos automaticamente se possível
    whitelist: true,      // Remove campos que não estão no DTO
    forbidNonWhitelisted: true,   // Dá erro se mandarem campo extra
  }))

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
