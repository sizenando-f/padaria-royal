import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()   // Torna o prisma visível para todo o app
@Module({
    providers: [PrismaService],
    exports: [PrismaService],   // Permite que outros módulos usem o PrismaService
})
export class PrismaModule {}
