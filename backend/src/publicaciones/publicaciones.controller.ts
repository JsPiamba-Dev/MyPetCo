
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePublicacionDto,
  ListPublicacionesDto,
} from './publicaciones.dto';
import { PublicacionesService } from './publicaciones.service';

type AuthRequest = {
  user?: {
    sub?: string;
    rol?: string;
  };
};

@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly service: PublicacionesService) { }

  private providerId(req: AuthRequest, roles: string[]): string {
    if (!roles.includes(req.user?.rol ?? '')) {
      throw new ForbiddenException(
        'No tienes permisos para publicar este contenido.',
      );
    }

    if (!req.user?.sub) {
      throw new UnauthorizedException(
        'No fue posible identificar la cuenta autenticada.',
      );
    }

    return req.user.sub;
  }

  // Catálogo público: no requiere token.
  @Get()
  listar(@Query() filtros: ListPublicacionesDto) {
    return this.service.listar(filtros);
  }

  // Crear productos: requiere autenticación.
  @UseGuards(JwtAuthGuard)
  @Post('productos')
  crearProducto(
    @Req() req: AuthRequest,
    @Body() dto: CreatePublicacionDto,
  ) {
    return this.service.crearProducto(
      this.providerId(req, ['EMPRESA']),
      dto,
    );
  }

  // Crear servicios: requiere autenticación.
  @UseGuards(JwtAuthGuard)
  @Post('servicios')
  crearServicio(
    @Req() req: AuthRequest,
    @Body() dto: CreatePublicacionDto,
  ) {
    return this.service.crearServicio(
      this.providerId(req, ['EMPRESA', 'VETERINARIA']),
      dto,
    );
  }
}
