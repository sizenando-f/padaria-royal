// src/prisma/prisma/service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Injectable diz ao Nest que essa classe pode ser "injetada" em outros lugares
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    // Quando o módulo iniciar, conecta ao banco de dados
    async onModuleInit() {
        await this.$connect();
    }
}
