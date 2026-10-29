import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CitasService } from './citas.service';
import { CreateCitaDto, ListCitasDto, UpdateCitaEstadoDto } from './citas.dto';

type AuthRequest = { user?: { sub?: string; rol?: string } };

@Controller('citas')
@UseGuards(JwtAuthGuard)
export class CitasController {
  constructor(private readonly service: CitasService) {}

  private accountId(req: AuthRequest): string {
    if (!req.user?.sub) throw new UnauthorizedException('No fue posible identificar la cuenta autenticada.');
    return req.user.sub;
  }
  private requireRole(req: AuthRequest, roles: string[]) {
    if (!req.user?.rol || !roles.includes(req.user.rol)) throw new ForbiddenException('No tienes permisos para esta operación.');
  }

  @Get('mias')
  misCitas(@Req() req: AuthRequest) {
    this.requireRole(req, ['PROPIETARIO']);
    return this.service.misCitas(this.accountId(req));
  }

  @Get('gestion')
  gestion(@Req() req: AuthRequest, @Query() filtros: ListCitasDto) {
    this.requireRole(req, ['VETERINARIA']);
    return this.service.gestion(this.accountId(req), filtros);
  }

  @Post()
  solicitar(@Req() req: AuthRequest, @Body() dto: CreateCitaDto) {
    this.requireRole(req, ['PROPIETARIO']);
    return this.service.solicitar(this.accountId(req), dto);
  }

  @Patch(':id/estado')
  cambiarEstado(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateCitaEstadoDto) {
    this.requireRole(req, ['PROPIETARIO', 'VETERINARIA']);
    return this.service.cambiarEstado(this.accountId(req), req.user!.rol!, id, dto);
  }
}
