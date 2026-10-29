import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { cuentas_acceso_rol, cuentas_acceso_estado } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CreateAdminUserDto } from './admin.dto';
import { UpdateAdminUserDto } from './admin.dto';
import { ListAdminUsersDto } from './admin.dto';
import { PetAnalyticsDto } from './admin.dto';
import { CreateExternalTokenDto } from './admin.dto';
import { AdminExternalTokensService } from './admin-external-tokens.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: AdminExternalTokensService,
  ) {}

  async listarUsuarios(f: ListAdminUsersDto) {
    const accounts = await this.prisma.cuentas_acceso.findMany({
      where: {
        ...(f.rol ? { rol: f.rol as cuentas_acceso_rol } : {}),
        ...(f.estado ? { estado: f.estado as cuentas_acceso_estado } : {}),
        ...(f.q ? { OR: [
          { correo: { contains: f.q } },
          { usuarios: { is: { nombre: { contains: f.q } } } },
          { proveedores: { is: { nombre_comercial: { contains: f.q } } } },
        ] } : {}),
        ...(f.ciudad ? { OR: [
          { usuarios: { is: { ciudad: { contains: f.ciudad } } } },
          { proveedores: { is: { ciudad: { contains: f.ciudad } } } },
        ] } : {}),
      },
      include: {
        usuarios: { include: { _count: { select: { mascotas: true } } } },
        proveedores: true,
      },
      orderBy: { fecha_registro: 'desc' },
    });
    return accounts.map((a) => ({
      id: a.id,
      nombre: a.usuarios?.nombre ?? a.proveedores?.nombre_comercial ?? a.correo,
      correo: a.correo, rol: a.rol, estado: a.estado,
      ciudad: a.usuarios?.ciudad ?? a.proveedores?.ciudad ?? null,
      fecha_registro: a.fecha_registro,
      total_mascotas: a.usuarios?._count.mascotas ?? 0,
    }));
  }

  async crearUsuario(dto: CreateAdminUserDto) {
    const correo = dto.correo.trim().toLowerCase();
    if (await this.prisma.cuentas_acceso.findUnique({ where: { correo } })) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }
    const id = randomUUID();
    const hash = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction(async (tx) => {
      await tx.cuentas_acceso.create({
        data: { id, correo, hash_contrasena: hash, rol: dto.rol, estado: 'ACTIVA' },
      });
      if (dto.rol === 'PROPIETARIO') {
        await tx.usuarios.create({ data: { cuenta_id: id, nombre: dto.nombre.trim(), ciudad: dto.ciudad } });
      } else if (dto.rol === 'EMPRESA' || dto.rol === 'VETERINARIA') {
        await tx.proveedores.create({
          data: { cuenta_id: id, nombre_comercial: dto.nombre.trim(), ciudad: dto.ciudad, estado_proveedor: 'PENDIENTE_VERIFICACION' },
        });
      }
    });
    return {
      id, nombre: dto.nombre.trim(), correo, rol: dto.rol, estado: 'ACTIVA',
      ciudad: dto.ciudad ?? null, total_mascotas: 0,
    };
  }

  async actualizarUsuario(id: string, dto: UpdateAdminUserDto) {
    const account = await this.prisma.cuentas_acceso.findUnique({
      where: { id }, include: { usuarios: true, proveedores: true },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada.');
    await this.prisma.$transaction(async (tx) => {
      await tx.cuentas_acceso.update({
        where: { id },
        data: {
          ...(dto.rol ? { rol: dto.rol } : {}),
          ...(dto.estado ? { estado: dto.estado } : {}),
        },
      });
      if (account.usuarios && (dto.nombre !== undefined || dto.ciudad !== undefined)) {
        await tx.usuarios.update({
          where: { cuenta_id: id },
          data: { ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}), ...(dto.ciudad !== undefined ? { ciudad: dto.ciudad } : {}) },
        });
      }
      if (account.proveedores && (dto.nombre !== undefined || dto.ciudad !== undefined)) {
        await tx.proveedores.update({
          where: { cuenta_id: id },
          data: { ...(dto.nombre !== undefined ? { nombre_comercial: dto.nombre } : {}), ...(dto.ciudad !== undefined ? { ciudad: dto.ciudad } : {}) },
        });
      }
    });
    const result = await this.listarUsuarios({});
    const updated = result.find((u) => u.id === id);
    if (!updated) throw new NotFoundException('No se pudo recuperar la cuenta actualizada.');
    return updated;
  }

  async eliminarUsuario(id: string, currentAdminId: string) {
    if (id === currentAdminId) throw new ForbiddenException('No puedes eliminar tu propia cuenta desde esta pantalla.');
    const account = await this.prisma.cuentas_acceso.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Cuenta no encontrada.');
    // Baja lógica: conserva historial clínico y evita fallos por claves foráneas.
    await this.prisma.cuentas_acceso.update({ where: { id }, data: { estado: 'DESACTIVADA' } });
    await this.prisma.proveedores.updateMany({
      where: { cuenta_id: id },
      data: { estado_proveedor: 'INACTIVO' },
    });
    return { ok: true, desactivada: true };
  }

  async informeAgregado(filters: PetAnalyticsDto) {
    const pets = await this.prisma.mascotas.findMany({
      where: {
        fecha_retiro: null,
        ...(filters.especie ? { especie: filters.especie } : {}),
        ...(filters.raza ? { raza: { contains: filters.raza } } : {}),
        ...(filters.ciudad ? { usuarios: { ciudad: { contains: filters.ciudad } } } : {}),
      },
      select: { especie: true, raza: true, usuarios: { select: { ciudad: true, cuenta_id: true } } },
    });
    const byCity = new Map<string, { cantidad_mascotas: number; owners: Set<string> }>();
    const bySpecies = new Map<string, number>();
    const byBreed = new Map<string, number>();
    const owners = new Set<string>();
    for (const pet of pets) {
      const city = pet.usuarios.ciudad || 'Sin ciudad';
      if (!byCity.has(city)) byCity.set(city, { cantidad_mascotas: 0, owners: new Set() });
      const cityEntry = byCity.get(city)!;
      cityEntry.cantidad_mascotas++;
      cityEntry.owners.add(pet.usuarios.cuenta_id);
      owners.add(pet.usuarios.cuenta_id);
      bySpecies.set(pet.especie, (bySpecies.get(pet.especie) ?? 0) + 1);
      const breedKey = `${pet.especie}|${pet.raza || 'Sin raza'}`;
      byBreed.set(breedKey, (byBreed.get(breedKey) ?? 0) + 1);
    }
    // Umbral mínimo para reducir el riesgo de identificar grupos pequeños.
    return {
      total_mascotas: pets.length,
      total_propietarios: owners.size,
      por_ciudad: [...byCity.entries()]
        .filter(([, v]) => v.cantidad_mascotas >= 5)
        .map(([ciudad, v]) => ({ ciudad, cantidad_mascotas: v.cantidad_mascotas, cantidad_propietarios: v.owners.size })),
      por_especie: [...bySpecies.entries()].map(([especie, cantidad]) => ({ especie, cantidad })),
      por_raza: [...byBreed.entries()]
        .filter(([, cantidad]) => cantidad >= 5)
        .map(([key, cantidad]) => {
          const [especie, raza] = key.split('|');
          return { raza, especie, cantidad };
        }),
    };
  }

  listarTokens() { return this.tokenService.listar(); }
  crearToken(adminId: string, dto: CreateExternalTokenDto) { return this.tokenService.crear(adminId, dto); }
  revocarToken(id: string) { return this.tokenService.revocar(id); }
}
