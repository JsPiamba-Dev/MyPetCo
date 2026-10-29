
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCitaDto {
  @IsUUID() mascota_id!: string;
  @IsUUID() proveedor_id!: string;
  @IsOptional() @IsUUID() servicio_id?: string;
  @IsDateString() fecha_solicitada!: string;
  @IsOptional() @IsString() @MaxLength(2000) motivo?: string;
}

export class ListCitasDto {
  @IsOptional()
  @IsIn(['SOLICITADA', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'])
  estado?: 'SOLICITADA' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA';
}

export class UpdateCitaEstadoDto {
  @IsIn(['CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'])
  estado!: 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA';

  @IsOptional() @IsString() @MaxLength(2000)
  notas_proveedor?: string;
}
