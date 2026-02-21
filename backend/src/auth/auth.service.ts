import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    // Busca o usuário
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Compara a senha
    const senhaValida = await bcrypt.compare(pass, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inváldias');
    }

    // Gerentes não precisam de restriçã de horário
    if(usuario.cargo !== 'GERENTE' && usuario.horarioEntrada && usuario.horarioSaida){
      const agora = new Date();
      // Ajusta para o fuso do Brasil
      const horaAtual = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Compara strings de hora
      if(horaAtual < usuario.horarioEntrada || horaAtual > usuario.horarioSaida) {
        throw new UnauthorizedException(`Acesso negado. Seu horário permitido é das ${usuario.horarioEntrada} às ${usuario.horarioSaida}.`);
      }
    }

    // Gera o Token
    const payload = {
      sub: usuario.id,
      nome: usuario.nome,
      cargo: usuario.cargo,
      // As permissões são enviadas para o front esconder botões
      permissoes: {
        registrar: usuario.podeRegistrar,
        avaliar: usuario.podeAvaliar,
        historico: usuario.podeVerHistorico
      }
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      // Devolve dados básicos para o front reconhecer
      usuario: {
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        permissoes: payload.permissoes,
      },
    };
  }
}
