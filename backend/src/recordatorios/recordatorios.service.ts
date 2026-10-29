import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CreateRecordatorioDto } from './recordatorios.dto';
import { UpdateRecordatorioDto } from './recordatorios.dto';

@Injectable()
export class RecordatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(ownerId: string) {
    return this.prisma.recordatorios.findMany({
      where: { usuario_id: ownerId },
      include: { mascotas: { select: { id: true, nombre: true } }, registros_vacunacion: true },
      orderBy: { fecha_programada: 'asc' },
    });
  }

  async crear(ownerId: string, dto: CreateRecordatorioDto) {
    const pet = await this.prisma.mascotas.findFirst({
      where: { id: dto.mascota_id, propietario_id: ownerId, fecha_retiro: null },
    });
    if (!pet) throw new ForbiddenException('La mascota no pertenece a tu cuenta o no existe.');
    return this.prisma.recordatorios.create({
      data: {
        id: randomUUID(), usuario_id: ownerId, mascota_id: pet.id,
        titulo: dto.titulo, descripcion: dto.descripcion,
        fecha_programada: new Date(dto.fecha_programada), tipo: dto.tipo,
        registro_vacunacion_id: dto.registro_vacunacion_id,
      },
      include: { mascotas: { select: { id: true, nombre: true } } },
    });
  }

  async actualizar(ownerId: string, id: string, dto: UpdateRecordatorioDto) {
    const current = await this.prisma.recordatorios.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Recordatorio no encontrado.');
    if (current.usuario_id !== ownerId) throw new ForbiddenException();
    const data: any = { ...dto };
    if (dto.fecha_programada) data.fecha_programada = new Date(dto.fecha_programada);
    if (dto.estado === 'COMPLETADO') data.fecha_completado = new Date();
    if (dto.estado && dto.estado !== 'COMPLETADO') data.fecha_completado = null;
    return this.prisma.recordatorios.update({ where: { id }, data });
  }

  async eliminar(ownerId: string, id: string) {
    const current = await this.prisma.recordatorios.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Recordatorio no encontrado.');
    if (current.usuario_id !== ownerId) throw new ForbiddenException();
    await this.prisma.recordatorios.delete({ where: { id } });
    return { ok: true };
  }
}
