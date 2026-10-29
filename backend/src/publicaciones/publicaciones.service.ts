import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma, publicaciones_tipo } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { CreatePublicacionDto } from './publicaciones.dto';
import { ListPublicacionesDto } from './publicaciones.dto';

@Injectable()
export class PublicacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: ListPublicacionesDto) {
    const and: Prisma.publicacionesWhereInput[] = [{ activa: true }];
    if (filtros.tipo) and.push({ tipo: filtros.tipo as publicaciones_tipo });
    if (filtros.ciudad) and.push({ ciudad: { contains: filtros.ciudad } });
    if (filtros.q) {
      and.push({ OR: [
        { titulo: { contains: filtros.q } },
        { descripcion: { contains: filtros.q } },
        { proveedores: { nombre_comercial: { contains: filtros.q } } },
      ] });
    }
    if (filtros.proveedor === 'EMPRESA') and.push({ proveedores: { empresas: { isNot: null } } });
    if (filtros.proveedor === 'VETERINARIA') and.push({ proveedores: { veterinarias: { isNot: null } } });
    if (filtros.especie) {
      and.push({ OR: [
        { productos: { is: { especie_objetivo: filtros.especie } } },
        { servicios: { is: { especie_objetivo: filtros.especie } } },
      ] });
    }

    return this.prisma.publicaciones.findMany({
      where: { AND: and },
      orderBy: { fecha_publicacion: 'desc' },
      include: {
        proveedores: { include: { empresas: true, veterinarias: true } },
        productos: true,
        servicios: true,
      },
    });
  }

  async crearProducto(accountId: string, dto: CreatePublicacionDto) {
    if (!dto.producto) throw new BadRequestException('Falta el detalle del producto.');
    const provider = await this.prisma.proveedores.findUnique({
      where: { cuenta_id: accountId },
      include: { empresas: true, cuentas_acceso: true },
    });
    if (!provider) throw new NotFoundException('No existe el perfil de proveedor.');
    if (provider.cuentas_acceso.rol !== 'EMPRESA' || !provider.empresas) {
      throw new ForbiddenException('Solo una empresa con perfil comercial puede publicar productos.');
    }

    return this.prisma.publicaciones.create({
      data: {
        id: randomUUID(), proveedor_id: accountId, tipo: 'PRODUCTO',
        titulo: dto.titulo, descripcion: dto.descripcion, ciudad: dto.ciudad ?? provider.ciudad,
        imagen: dto.imagen,
        productos: { create: {
          categoria: dto.producto.categoria,
          especie_objetivo: dto.producto.especie_objetivo,
          etapa_vida: dto.producto.etapa_vida ?? 'NO_ESPECIFICADA',
          precio: dto.producto.precio,
          moneda: dto.producto.moneda ?? 'COP',
          enlace_compra: dto.producto.enlace_compra,
          disponibilidad: dto.producto.disponibilidad,
        } },
      },
      include: { proveedores: { include: { empresas: true, veterinarias: true } }, productos: true, servicios: true },
    });
  }

  async crearServicio(accountId: string, dto: CreatePublicacionDto) {
    if (!dto.servicio) throw new BadRequestException('Falta el detalle del servicio.');
    const provider = await this.prisma.proveedores.findUnique({
      where: { cuenta_id: accountId },
      include: { veterinarias: true, empresas: true, cuentas_acceso: true },
    });
    if (!provider) throw new NotFoundException('No existe el perfil de proveedor.');
    if (!['EMPRESA', 'VETERINARIA'].includes(provider.cuentas_acceso.rol)) {
      throw new ForbiddenException('Este rol no puede publicar servicios.');
    }
    return this.prisma.publicaciones.create({
      data: {
        id: randomUUID(), proveedor_id: accountId, tipo: 'SERVICIO',
        titulo: dto.titulo, descripcion: dto.descripcion, ciudad: dto.ciudad ?? provider.ciudad,
        imagen: dto.imagen,
        servicios: { create: {
          categoria: dto.servicio.categoria,
          especie_objetivo: dto.servicio.especie_objetivo,
          modalidad: dto.servicio.modalidad,
          precio_desde: dto.servicio.precio_desde,
          requisitos: dto.servicio.requisitos,
        } },
      },
      include: { proveedores: { include: { empresas: true, veterinarias: true } }, productos: true, servicios: true },
    });
  }
}
