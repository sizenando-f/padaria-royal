import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsuarioService {
    constructor(
        private prisma: PrismaService
    ) {}

    async findAll(){
        // Retorna os usuários menos as suas senhas
        return await this.prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                cargo: true,
                podeRegistrar: true,
                podeAvaliar: true,
                podeVerHistorico: true,
                horarioEntrada: true,
                horarioSaida: true,
                criadoEm: true
            },
            orderBy: {
                id: 'desc'
            }
        });
    }

    async create(data: any){
        // Verifica se email já está cadastrado
        const usuarioExiste = await this.prisma.usuario.findUnique({
            where: {
                email: data.email
            }
        });

        if(usuarioExiste){
            throw new ConflictException("Este email já está em uso.");
        }

        const senhaHash = await bcrypt.hash(data.senha, 10);

        // Adiciona o usuário
        return await this.prisma.usuario.create({
            data: {
                nome: data.nome,
                email: data.email,
                senha: senhaHash,
                cargo: data.cargo,
                podeRegistrar: data.podeRegistrar,
                podeAvaliar: data.podeAvaliar,
                podeVerHistorico: data.podeVerHistorico,
                horarioEntrada: data.horarioEntrada || null,
                horarioSaida: data.horarioSaida || null,
            },
        });
    }

    async update(id: number, data: any){
        if(data.senha && data.senha.trim() !== ""){
            data.senha = await bcrypt.hash(data.senha, 10);
        } else {
            delete data.senha;
        }

        return await this.prisma.usuario.update({
            where: { id },
            data,
        });
    }

    // Remove usuário
    async remove(id: number){
        return await this.prisma.usuario.delete({
            where: { id },
        });
    }
}