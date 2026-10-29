import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExternalApiService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregatedPets(filters: { ciudad?: string; especie?: 'PERRO' | 'GATO'; raza?: string }) {
    const pets = await this.prisma.mascotas.findMany({
      where: {
        fecha_retiro: null,
        ...(filters.especie ? { especie: filters.especie } : {}),
        ...(filters.ciudad ? { usuarios: { ciudad: { contains: filters.ciudad } } } : {}),
        ...(filters.raza ? { raza: { contains: filters.raza } } : {}),
      },
      select: { especie: true, raza: true, usuarios: { select: { ciudad: true, cuenta_id: true } } },
    });
    const cities = new Map<string, { pets: number; owners: Set<string> }>();
    const species = new Map<string, number>();
    const breeds = new Map<string, number>();
    for (const p of pets) {
      const city = p.usuarios.ciudad || 'Sin ciudad';
      if (!cities.has(city)) cities.set(city, { pets: 0, owners: new Set() });
      const c = cities.get(city)!; c.pets++; c.owners.add(p.usuarios.cuenta_id);
      species.set(p.especie, (species.get(p.especie) ?? 0) + 1);
      const key = `${p.especie}|${p.raza || 'Sin raza'}`;
      breeds.set(key, (breeds.get(key) ?? 0) + 1);
    }
    return {
      total_mascotas: pets.length,
      por_ciudad: [...cities.entries()].filter(([, v]) => v.pets >= 5)
        .map(([ciudad, v]) => ({ ciudad, cantidad_mascotas: v.pets, cantidad_propietarios: v.owners.size })),
      por_especie: [...species.entries()].map(([especie, cantidad]) => ({ especie, cantidad })),
      por_raza: [...breeds.entries()].filter(([, cantidad]) => cantidad >= 5)
        .map(([key, cantidad]) => ({ especie: key.split('|')[0], raza: key.split('|')[1], cantidad })),
    };
  }
}
