import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';
import { ListProveedoresDto } from './proveedores.dto';
import { UpdateProveedorDto } from './proveedores.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  listar(filtros: ListProveedoresDto) {
    return this.prisma.proveedores.findMany({
      where: {
        estado_proveedor: 'ACTIVO',
        ...(filtros.ciudad ? { ciudad: { contains: filtros.ciudad } } : {}),
        ...(filtros.q ? { OR: [
          { nombre_comercial: { contains: filtros.q } },
          { descripcion: { contains: filtros.q } },
        ] } : {}),
        ...(filtros.tipo === 'EMPRESA' ? { empresas: { isNot: null } } : {}),
        ...(filtros.tipo === 'VETERINARIA' ? { veterinarias: { isNot: null } } : {}),
      },
      include: {
        cuentas_acceso: { select: { correo: true, rol: true, estado: true } },
        empresas: true,
        veterinarias: true,
      },
      orderBy: { nombre_comercial: 'asc' },
    });
  }

  async miPerfil(accountId: string) {
    const provider = await this.prisma.proveedores.findUnique({
      where: { cuenta_id: accountId },
      include: { cuentas_acceso: true, empresas: true, veterinarias: true },
    });
    if (!provider) throw new NotFoundException('No existe el perfil de proveedor.');
    return provider;
  }

  async actualizarPerfil(accountId: string, dto: UpdateProveedorDto) {
    const account = await this.prisma.cuentas_acceso.findUnique({ where: { id: accountId } });
    if (!account || !['EMPRESA', 'VETERINARIA'].includes(account.rol)) throw new ForbiddenException();

    const provider = await this.prisma.proveedores.findUnique({ where: { cuenta_id: accountId } });
    if (!provider) throw new NotFoundException('No existe el perfil de proveedor. Debe crearse durante el registro.');
    const data: any = {
      nombre_comercial: dto.nombre_comercial,
      descripcion: dto.descripcion,
      telefono_contacto: dto.telefono_contacto,
      ciudad: dto.ciudad,
      direccion: dto.direccion,
      sitio_web: dto.sitio_web,
    };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    await this.prisma.proveedores.update({ where: { cuenta_id: accountId }, data });

    if (account.rol === 'VETERINARIA') {
      const existing = await this.prisma.veterinarias.findUnique({ where: { proveedor_id: accountId } });
      const vetData: any = {
        nombre_responsable: dto.nombre_responsable,
        registro_profesional: dto.registro_profesional,
        horario_atencion: dto.horario_atencion,
        servicios_clinicos: dto.servicios_clinicos,
      };
      Object.keys(vetData).forEach((k) => vetData[k] === undefined && delete vetData[k]);
      if (existing && Object.keys(vetData).length) {
        await this.prisma.veterinarias.update({ where: { proveedor_id: accountId }, data: vetData });
      } else if (!existing && dto.nombre_responsable && dto.registro_profesional) {
        await this.prisma.veterinarias.create({
          data: { proveedor_id: accountId, nombre_responsable: dto.nombre_responsable, registro_profesional: dto.registro_profesional, horario_atencion: dto.horario_atencion, servicios_clinicos: dto.servicios_clinicos },
        });
      }
    } else {
      const existing = await this.prisma.empresas.findUnique({ where: { proveedor_id: accountId } });
      const companyData: any = {
        identificacion_tributaria: dto.identificacion_tributaria,
        categoria_comercial: dto.categoria_comercial,
      };
      Object.keys(companyData).forEach((k) => companyData[k] === undefined && delete companyData[k]);
      if (existing && Object.keys(companyData).length) {
        await this.prisma.empresas.update({ where: { proveedor_id: accountId }, data: companyData });
      } else if (!existing && dto.identificacion_tributaria) {
        await this.prisma.empresas.create({
          data: { proveedor_id: accountId, identificacion_tributaria: dto.identificacion_tributaria, categoria_comercial: dto.categoria_comercial },
        });
      }
    }
    return this.miPerfil(accountId);
  }
}
