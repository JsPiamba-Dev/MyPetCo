import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { ListAdminUsersDto, CreateAdminUserDto, UpdateAdminUserDto, PetAnalyticsDto, CreateExternalTokenDto } from './admin.dto';

type AuthRequest = { user?: { sub?: string; correo?: string; rol?: string } };

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  private adminId(req: AuthRequest): string {
    if (req.user?.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Esta operación requiere rol ADMINISTRADOR.');
    }
    if (!req.user.sub) throw new UnauthorizedException('No fue posible identificar la cuenta autenticada.');
    return req.user.sub;
  }

  @Get('users')
  listarUsuarios(@Req() req: AuthRequest, @Query() filtros: ListAdminUsersDto) {
    this.adminId(req);
    return this.service.listarUsuarios(filtros);
  }

  @Post('users')
  crearUsuario(@Req() req: AuthRequest, @Body() dto: CreateAdminUserDto) {
    this.adminId(req);
    return this.service.crearUsuario(dto);
  }

  @Patch('users/:id')
  actualizarUsuario(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    this.adminId(req);
    return this.service.actualizarUsuario(id, dto);
  }

  @Delete('users/:id')
  eliminarUsuario(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.service.eliminarUsuario(id, this.adminId(req));
  }

  @Get('analytics/pets')
  informeAgregado(@Req() req: AuthRequest, @Query() filtros: PetAnalyticsDto) {
    this.adminId(req);
    return this.service.informeAgregado(filtros);
  }

  @Get('integrations/tokens')
  listarTokens(@Req() req: AuthRequest) {
    this.adminId(req);
    return this.service.listarTokens();
  }

  @Post('integrations/tokens')
  crearToken(@Req() req: AuthRequest, @Body() dto: CreateExternalTokenDto) {
    return this.service.crearToken(this.adminId(req), dto);
  }

  @Patch('integrations/tokens/:id/revoke')
  revocarToken(@Req() req: AuthRequest, @Param('id') id: string) {
    this.adminId(req);
    return this.service.revocarToken(id);
  }
}
