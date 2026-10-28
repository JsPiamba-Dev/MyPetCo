
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CrearRegistroVacunacionDto } from './dto';

@Injectable()
export class VacunasService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Listar vacunas activas
  async listarVacunas() {
    return this.prisma.vacunas.findMany({
      where: {
        activa: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  // 2. Consultar reglas por vacuna y especie
  async listarReglas(vacunaId: string, especie: string) {
    if (!['PERRO', 'GATO'].includes(especie)) {
      throw new BadRequestException(
        'La especie debe ser PERRO o GATO',
      );
    }

    const vacuna = await this.prisma.vacunas.findUnique({
      where: {
        id: vacunaId,
      },
    });

    if (!vacuna || !vacuna.activa) {
      throw new NotFoundException(
        'La vacuna no existe o está inactiva',
      );
    }

    return this.prisma.reglas_vacunacion.findMany({
      where: {
        vacuna_id: vacunaId,
        especie: especie as any,
      },
      orderBy: {
        edad_minima_meses: 'asc',
      },
    });
  }

  // 3. Registrar una aplicación para una mascota propia
  async registrarVacuna(
    mascotaId: string,
    usuarioId: string,
    dto: CrearRegistroVacunacionDto,
  ) {
    const mascota = await this.prisma.mascotas.findFirst({
      where: {
        id: mascotaId,
        propietario_id: usuarioId,
      },
    });

    if (!mascota) {
      throw new NotFoundException(
        'Mascota no encontrada o no pertenece a este propietario',
      );
    }

    const vacuna = await this.prisma.vacunas.findUnique({
      where: {
        id: dto.vacuna_id,
      },
    });

    if (!vacuna || !vacuna.activa) {
      throw new BadRequestException(
        'La vacuna no existe o está inactiva',
      );
    }

    if (dto.regla_vacunacion_id) {
      const regla = await this.prisma.reglas_vacunacion.findFirst({
        where: {
          id: dto.regla_vacunacion_id,
          vacuna_id: dto.vacuna_id,
          especie: mascota.especie,
        },
      });

      if (!regla) {
        throw new BadRequestException(
          'La regla no corresponde a la vacuna o a la especie de la mascota',
        );
      }
    }

    const fechaAplicacion = dto.fecha_aplicacion
      ? new Date(dto.fecha_aplicacion)
      : null;

    const fechaProxima = dto.fecha_proxima_aplicacion
      ? new Date(dto.fecha_proxima_aplicacion)
      : null;

    if (
      fechaAplicacion &&
      fechaProxima &&
      fechaProxima < fechaAplicacion
    ) {
      throw new BadRequestException(
        'La próxima aplicación no puede ser anterior a la fecha de aplicación',
      );
    }

    return this.prisma.registros_vacunacion.create({
      data: {
        id: randomUUID(),
        mascota_id: mascotaId,
        vacuna_id: dto.vacuna_id,
        regla_vacunacion_id: dto.regla_vacunacion_id ?? null,
        registrado_por_id: usuarioId,
        fecha_aplicacion: fechaAplicacion,
        dosis: dto.dosis?.trim() || null,
        lote: dto.lote?.trim() || null,
        observaciones: dto.observaciones?.trim() || null,
        fecha_proxima_aplicacion: fechaProxima,
        comprobante: dto.comprobante?.trim() || null,
        origen: 'PROPIETARIO',
        estado: 'APLICADA_DECLARADA',
      },
      include: {
        vacunas: true,
        reglas_vacunacion: true,
      },
    });
  }
}
