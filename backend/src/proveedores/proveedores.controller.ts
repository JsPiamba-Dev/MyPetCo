import { Body, Controller, ForbiddenException, Get, Patch, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListProveedoresDto, UpdateProveedorDto } from './proveedores.dto';
import { ProveedoresService } from './proveedores.service';

type AuthRequest = { user?: { sub?: string; rol?: string } };

@Controller('proveedores')
@UseGuards(JwtAuthGuard)
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  private providerId(req: AuthRequest): string {
    if (!['EMPRESA', 'VETERINARIA'].includes(req.user?.rol ?? '')) throw new ForbiddenException('Esta operación requiere rol EMPRESA o VETERINARIA.');
    if (!req.user?.sub) throw new UnauthorizedException('No fue posible identificar la cuenta autenticada.');
    return req.user.sub;
  }

  @Get()
  listar(@Query() filtros: ListProveedoresDto) { return this.service.listar(filtros); }

  @Get('mi-perfil')
  miPerfil(@Req() req: AuthRequest) { return this.service.miPerfil(this.providerId(req)); }

  @Patch('mi-perfil')
  actualizar(@Req() req: AuthRequest, @Body() dto: UpdateProveedorDto) { return this.service.actualizarPerfil(this.providerId(req), dto); }
}
