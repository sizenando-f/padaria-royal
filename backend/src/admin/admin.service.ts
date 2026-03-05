import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

    async getLogsExclusao() {
        return await this.prisma.logExclusao.findMany({
            orderBy: {
                dataExclusao: 'desc'
            },
            take: 100   // Limita em 100 para não pesar
        });
    }

    async getEmailBackup() {
        const config = await this.prisma.configuracao.findUnique({
            where: {
                chave: 'EMAIL_BACKUP'
            }
        });

        // Se não tiver, pega do .env
        return {
            email: config ? config.valor : process.env.EMAIL_DESTINO
        };
    }

    async updateEmailBackup(novoEmail: string){
        // Atualiza se existir e cria se não
        return await this.prisma.configuracao.upsert({
            where: {
                chave: 'EMAIL_BACKUP'
            },
            update: {
                valor: novoEmail
            },
            create: {
                chave: 'EMAIL_BACKUP',
                valor: novoEmail
            },
        });
    }
}