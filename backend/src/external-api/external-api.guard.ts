import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExternalApiGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Falta el token externo.');
    let payload: any;
    try { payload = await this.jwt.verifyAsync(auth.slice(7)); }
    catch { throw new UnauthorizedException('Token externo inválido o vencido.'); }

    if (payload.typ !== 'external_api' || typeof payload.jti !== 'string') {
      throw new UnauthorizedException('El token no corresponde a una integración externa.');
    }
    const row = await this.prisma.external_api_tokens.findUnique({ where: { id: payload.jti } });
    if (!row || row.revoked_at || row.expires_at <= new Date()) throw new ForbiddenException('Token revocado o vencido.');
    const scopes = Array.isArray(row.scopes) ? row.scopes : [];
    if (!scopes.includes('analytics:read') || !scopes.includes('pets:aggregate')) {
      throw new ForbiddenException('El token no cuenta con los permisos requeridos.');
    }
    await this.prisma.external_api_tokens.update({ where: { id: row.id }, data: { last_used_at: new Date() } });
    request.externalClient = { id: row.id, client_name: row.client_name, scopes };
    return true;
  }
}
