import { Module } from "@nestjs/common";
import { BackupService } from "./backup.service";
import { PrismaService } from "src/prisma/prisma.service";
import { BackupController } from './backup.controller';

@Module({
    controllers: [BackupController],
    providers: [BackupService, PrismaService],
    exports: [BackupService],   // Necessário exportar para usar no controller da avaliação/dashboard
})
export class BackupModule {}