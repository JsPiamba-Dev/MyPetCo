import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CreateExternalTokenDto } from './admin.dto';

@Injectable()
export class AdminExternalTokensService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  listar() {
    return this.prisma.external_api_tokens.findMany({
      select: {
        id: true, client_name: true, contract_reference: true, purpose: true,
        scopes: true, created_at: true, expires_at: true, revoked_at: true, last_used_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async crear(createdById: string, dto: CreateExternalTokenDto) {
    if (!dto.scopes.every((s) => ['analytics:read', 'pets:aggregate'].includes(s))) {
      throw new BadRequestException('El token contiene permisos no admitidos.');
    }
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + dto.expires_in_days * 24 * 60 * 60 * 1000);
    await this.prisma.external_api_tokens.create({
      data: {
        id, client_name: dto.client_name.trim(), contract_reference: dto.contract_reference.trim(),
        purpose: dto.purpose.trim(), scopes: dto.scopes, created_by_id: createdById, expires_at: expiresAt,
      },
    });
    const token = await this.jwt.signAsync(
      { typ: 'external_api', jti: id, client_name: dto.client_name.trim(), scopes: dto.scopes },
      { subject: id, expiresIn: `${dto.expires_in_days}d` },
    );
    return { token, id, expires_at: expiresAt };
  }

  async revocar(id: string) {
    const token = await this.prisma.external_api_tokens.findUnique({ where: { id } });
    if (!token) throw new NotFoundException('Token no encontrado.');
    if (token.revoked_at) return token;
    return this.prisma.external_api_tokens.update({ where: { id }, data: { revoked_at: new Date() } });
  }

  async assertActive(jti: string, requiredScope: string) {
    const record = await this.prisma.external_api_tokens.findUnique({ where: { id: jti } });
    if (!record || record.revoked_at || record.expires_at <= new Date()) {
      throw new ForbiddenException('Token externo revocado, vencido o inexistente.');
    }
    const scopes = Array.isArray(record.scopes) ? record.scopes : [];
    if (!scopes.includes(requiredScope)) throw new ForbiddenException('El token no tiene el alcance requerido.');
    await this.prisma.external_api_tokens.update({ where: { id: jti }, data: { last_used_at: new Date() } });
    return record;
  }
}
