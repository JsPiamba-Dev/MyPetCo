import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { CreatePetDto, UpdatePetDto } from './dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) { }

  // Listar las mascotas de un propietario
  async list(userId: string) {
    return this.prisma.mascotas.findMany({
      where: {
        propietario_id: userId,
        fecha_retiro: null,
      },
      orderBy: {
        fecha_registro: 'desc',
      },
    });
  }

  // Consultar una mascota y sus relaciones
  async get(userId: string, id: string) {
    const pet = await this.prisma.mascotas.findFirst({
      where: {
        id,
        propietario_id: userId,
        fecha_retiro: null,
      },
      include: {
        historial_salud: true,
        recordatorios: true,
        registros_vacunacion: true,
        registros_peso: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Mascota no encontrada');
    }

    return pet;
  }

  // Crear una mascota
  async create(userId: string, dto: CreatePetDto) {
    const {
      fechaNacimiento,
      edadAproximadaMeses,
      fechaEsterilizacion,
      pesoKg,
      ...rest
    } = dto;

    if (
      !fechaNacimiento &&
      edadAproximadaMeses === undefined
    ) {
      throw new BadRequestException(
        'Debes indicar la fecha de nacimiento o la edad aproximada en meses.',
      );
    }

    return this.prisma.mascotas.create({
      data: {
        ...rest,
        id: randomUUID(),
        propietario_id: userId,

        ...(fechaNacimiento
          ? { fecha_nacimiento: new Date(fechaNacimiento) }
          : {}),

        ...(edadAproximadaMeses !== undefined
          ? { edad_aproximada_meses: edadAproximadaMeses }
          : {}),

        ...(fechaEsterilizacion
          ? { fecha_esterilizacion: new Date(fechaEsterilizacion) }
          : {}),

        ...(pesoKg !== undefined
          ? { peso_kg: pesoKg }
          : {}),
      },
    });
  }

  // Actualizar una mascota propia
  async update(userId: string, id: string, dto: UpdatePetDto) {
    await this.get(userId, id);

    const {
      fechaNacimiento,
      fechaEsterilizacion,
      edadAproximadaMeses,
      pesoKg,
      ...rest
    } = dto;

    return this.prisma.mascotas.update({
      where: { id },
      data: {
        ...rest,
        ...(fechaNacimiento !== undefined
          ? {
            fecha_nacimiento: fechaNacimiento
              ? new Date(fechaNacimiento)
              : null,
          }
          : {}),
        ...(fechaEsterilizacion !== undefined
          ? {
            fecha_esterilizacion: fechaEsterilizacion
              ? new Date(fechaEsterilizacion)
              : null,
          }
          : {}),
        ...(edadAproximadaMeses !== undefined
          ? { edad_aproximada_meses: edadAproximadaMeses }
          : {}),
        ...(pesoKg !== undefined
          ? { peso_kg: pesoKg }
          : {}),
      },
    });
  }

  // Eliminar una mascota de forma lógica
  async remove(userId: string, id: string) {
    await this.get(userId, id);

    await this.prisma.mascotas.update({
      where: { id },
      data: {
        fecha_retiro: new Date(),
      },
    });

    return {
      message: 'Mascota eliminada correctamente',
    };
  }
}
