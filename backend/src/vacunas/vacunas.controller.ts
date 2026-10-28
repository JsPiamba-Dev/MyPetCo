
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { VacunasService } from './vacunas.service';
import { CrearRegistroVacunacionDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class VacunasController {
  constructor(
    private readonly vacunasService: VacunasService,
  ) {}

  // Verificar que la cuenta autenticada sea un propietario
  private obtenerUsuarioPropietario(req: Request): string {
    const usuario = (req as any).user;

    const rol = usuario?.rol ?? usuario?.role;
    const id = usuario?.id ?? usuario?.sub;

    if (rol !== 'PROPIETARIO') {
      throw new ForbiddenException(
        'Solo los propietarios pueden realizar esta operación',
      );
    }

    if (!id) {
      throw new ForbiddenException(
        'No se encontró el usuario autenticado',
      );
    }

    return id;
  }

  // GET /vacunas
  @Get('vacunas')
  listarVacunas() {
    return this.vacunasService.listarVacunas();
  }

  // GET /vacunas/:id/reglas?especie=PERRO
  @Get('vacunas/:id/reglas')
  listarReglas(
    @Param('id') id: string,
    @Query('especie') especie: string,
  ) {
    return this.vacunasService.listarReglas(id, especie);
  }

  // POST /mascotas/:mascotaId/vacunas
  @Post('mascotas/:mascotaId/vacunas')
  registrarVacuna(
    @Param('mascotaId') mascotaId: string,
    @Body() dto: CrearRegistroVacunacionDto,
    @Req() req: Request,
  ) {
    const usuarioId = this.obtenerUsuarioPropietario(req);

    return this.vacunasService.registrarVacuna(
      mascotaId,
      usuarioId,
      dto,
    );
  }
}
