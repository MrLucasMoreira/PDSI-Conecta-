import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { TipoUsuario } from '../usuarios/schemas/usuario.schema.js';

export type UsuarioAutenticado = {
  sub: string;
  email: string;
  tipo: TipoUsuario;
};

export type RequisicaoAutenticada = Request & {
  usuario: UsuarioAutenticado;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requisicao = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    const token = this.extrairToken(requisicao);

    if (!token) {
      throw new UnauthorizedException('Token de acesso não informado');
    }

    try {
      requisicao.usuario = await this.jwtService.verifyAsync<UsuarioAutenticado>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado');
    }
  }

  private extrairToken(requisicao: Request): string | undefined {
    const [tipo, token] = requisicao.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
