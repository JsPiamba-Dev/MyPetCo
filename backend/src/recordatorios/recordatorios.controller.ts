import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRecordatorioDto, UpdateRecordatorioDto } from './recordatorios.dto';
import { RecordatoriosService } from './recordatorios.service';

type AuthRequest = { user?: { sub?: string; rol?: string } };

@Controller('recordatorios')
@UseGuards(JwtAuthGuard)
export class RecordatoriosController {
  constructor(private readonly service: RecordatoriosService) {}
  private accountId(req: AuthRequest): string {
    if (req.user?.rol !== 'PROPIETARIO') throw new ForbiddenException('Esta operación requiere rol PROPIETARIO.');
    if (!req.user.sub) throw new UnauthorizedException('No fue posible identificar la cuenta autenticada.');
    return req.user.sub;
  }
  @Get() listar(@Req() req: AuthRequest) { return this.service.listar(this.accountId(req)); }
  @Post() crear(@Req() req: AuthRequest, @Body() dto: CreateRecordatorioDto) { return this.service.crear(this.accountId(req), dto); }
  @Patch(':id') actualizar(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateRecordatorioDto) { return this.service.actualizar(this.accountId(req), id, dto); }
  @Delete(':id') eliminar(@Req() req: AuthRequest, @Param('id') id: string) { return this.service.eliminar(this.accountId(req), id); }
}
