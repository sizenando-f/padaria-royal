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
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Compara a senha
    const isMatch = await bcrypt.compare(pass, user.senha);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inváldias');
    }

    // Gera o Token
    const payload = {
      sub: user.id,
      nome: user.nome,
      cargo: user.cargo,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      // Devolve dados básicos para o front reconhecer
      usuario: {
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
      },
    };
  }
}
