import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CreateCitaDto } from './citas.dto';
import { UpdateCitaEstadoDto } from './citas.dto';
import { ListCitasDto } from './citas.dto';

const includeCita = {
  mascotas: { select: { id: true, nombre: true, propietario_id: true } },
  usuarios: { select: { cuenta_id: true, nombre: true } },
  proveedores: { select: { cuenta_id: true, nombre_comercial: true } },
  publicaciones: { select: { id: true, titulo: true } },
};

@Injectable()
export class CitasService {
  constructor(private readonly prisma: PrismaService) {}

  async misCitas(ownerId: string) {
    const rows = await this.prisma.citas.findMany({
      where: { propietario_id: ownerId },
      include: includeCita,
      orderBy: { fecha_solicitada: 'desc' },
    });
    return rows.map((c) => this.toFrontend(c));
  }

  async gestion(providerId: string, filtros: ListCitasDto) {
    const rows = await this.prisma.citas.findMany({
      where: { proveedor_id: providerId, ...(filtros.estado ? { estado: filtros.estado } : {}) },
      include: includeCita,
      orderBy: { fecha_solicitada: 'asc' },
    });
    return rows.map((c) => this.toFrontend(c));
  }

  async solicitar(ownerId: string, dto: CreateCitaDto) {
    const fecha = new Date(dto.fecha_solicitada);
    if (!Number.isFinite(fecha.getTime()) || fecha <= new Date()) {
      throw new BadRequestException('La fecha de la cita debe estar en el futuro.');
    }

    const mascota = await this.prisma.mascotas.findFirst({
      where: { id: dto.mascota_id, propietario_id: ownerId, fecha_retiro: null },
    });
    if (!mascota) throw new ForbiddenException('La mascota no existe o no pertenece a tu cuenta.');

    const servicio = dto.servicio_id
      ? await this.prisma.publicaciones.findFirst({
          where: { id: dto.servicio_id, tipo: 'SERVICIO', activa: true, proveedor_id: dto.proveedor_id },
        })
      : null;
    if (dto.servicio_id && !servicio) {
      throw new BadRequestException('El servicio no existe, no está activo o no corresponde a esa veterinaria.');
    }

    const provider = await this.prisma.proveedores.findUnique({
      where: { cuenta_id: dto.proveedor_id },
      include: { veterinarias: true, cuentas_acceso: true },
    });
    if (!provider || provider.cuentas_acceso.rol !== 'VETERINARIA' || !provider.veterinarias) {
      throw new BadRequestException('La cita debe solicitarse a un proveedor veterinario válido.');
    }

    const created = await this.prisma.citas.create({
      data: {
        id: randomUUID(),
        mascota_id: mascota.id,
        propietario_id: ownerId,
        proveedor_id: provider.cuenta_id,
        servicio_id: servicio?.id,
        fecha_solicitada: fecha,
        estado: 'SOLICITADA',
        motivo: dto.motivo?.trim() || null,
      },
      include: includeCita,
    });
    return this.toFrontend(created);
  }

  async cambiarEstado(actorId: string, role: string | undefined, id: string, dto: UpdateCitaEstadoDto) {
    const cita = await this.prisma.citas.findUnique({ where: { id }, include: includeCita });
    if (!cita) throw new NotFoundException('No se encontró la cita.');

    if (role === 'PROPIETARIO') {
      if (cita.propietario_id !== actorId) throw new ForbiddenException();
      if (dto.estado !== 'CANCELADA' || !['SOLICITADA', 'CONFIRMADA'].includes(cita.estado)) {
        throw new BadRequestException('El propietario solo puede cancelar citas solicitadas o confirmadas.');
      }
    } else if (role === 'VETERINARIA') {
      if (cita.proveedor_id !== actorId) throw new ForbiddenException();
      if (dto.estado === 'CANCELADA') {
        throw new BadRequestException('La veterinaria debe usar RECHAZADA para declinar una solicitud.');
      }
      if (dto.estado === 'CONFIRMADA' && cita.estado !== 'SOLICITADA') {
        throw new BadRequestException('Solo se pueden confirmar citas solicitadas.');
      }
      if (dto.estado === 'RECHAZADA' && cita.estado !== 'SOLICITADA') {
        throw new BadRequestException('Solo se pueden rechazar citas solicitadas.');
      }
      if (dto.estado === 'COMPLETADA' && cita.estado !== 'CONFIRMADA') {
        throw new BadRequestException('Solo se pueden completar citas confirmadas.');
      }
    } else {
      throw new ForbiddenException('Rol no autorizado para modificar citas.');
    }

    const updated = await this.prisma.citas.update({
      where: { id },
      data: {
        estado: dto.estado,
        ...(role === 'VETERINARIA' && dto.notas_proveedor !== undefined
          ? { notas_proveedor: dto.notas_proveedor.trim() || null } : {}),
      },
      include: includeCita,
    });
    return this.toFrontend(updated);
  }

  private toFrontend(c: any) {
    return {
      id: c.id,
      mascota_id: c.mascota_id,
      mascota_nombre: c.mascotas?.nombre,
      propietario_id: c.propietario_id,
      propietario_nombre: c.usuarios?.nombre,
      proveedor_id: c.proveedor_id,
      proveedor_nombre: c.proveedores?.nombre_comercial,
      servicio_id: c.servicio_id,
      servicio_titulo: c.publicaciones?.titulo,
      fecha_solicitada: c.fecha_solicitada,
      estado: c.estado,
      motivo: c.motivo,
      notas_proveedor: c.notas_proveedor,
      fecha_creacion: c.fecha_creacion,
    };
  }
}
