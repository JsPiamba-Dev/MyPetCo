
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CrearRegistroVacunacionDto {
  @IsUUID()
  vacuna_id: string;

  @IsOptional()
  @IsUUID()
  regla_vacunacion_id?: string;

  @IsOptional()
  @IsDateString()
  fecha_aplicacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  dosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lote?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  fecha_proxima_aplicacion?: string;

  @IsOptional()
  @IsString()
  comprobante?: string;
}
