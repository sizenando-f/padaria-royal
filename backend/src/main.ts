import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';  // Importa

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Libera o Frontend
  app.enableCors({
    origin: 'http://localhost:3001',  // Só deixa o nosso front entrar
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    credentials: true,
  })

  // Ativa a validação global para o DTO
  app.useGlobalPipes(new ValidationPipe({
    transform: true,      // Converte tipos automaticamente se possível
    whitelist: true,      // Remove campos que não estão no DTO
    forbidNonWhitelisted: true,   // Dá erro se mandarem campo extra
  }))

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
