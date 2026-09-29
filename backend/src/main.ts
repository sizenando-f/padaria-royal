import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';  // Importa
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativa compressão HTTP (Gzip/Deflate)
  app.use(compression());

  // Libera o Frontend
  app.enableCors({
    origin: '*', 
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
  })

  // Ativa a validação global para o DTO
  app.useGlobalPipes(new ValidationPipe({
    transform: true,      // Converte tipos automaticamente se possível
    whitelist: true,      // Remove campos que não estão no DTO
    forbidNonWhitelisted: true,   // Dá erro se mandarem campo extra
  }))

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
