import { Module } from "@nestjs/common";
import { UsuarioController } from "./usuario.controller";
import { UsuarioService } from "./usuario.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
    controllers: [UsuarioController],
    providers: [UsuarioService, PrismaService],
    exports: [UsuarioService] // Para caso algum outro módulo precise
})
export class UsuarioModule {}