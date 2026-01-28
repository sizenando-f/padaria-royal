import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não encontrado. Faça login.');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      // Verifica se o token é valido usando senha
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secret,
      });
      // Anexa dados do usuário no objeto da requisição para controller acessar via req.user
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Sessão expirada ou inválida.');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
