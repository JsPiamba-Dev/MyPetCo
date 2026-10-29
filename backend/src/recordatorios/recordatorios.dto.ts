import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRecordatorioDto {
  @IsUUID() mascota_id!: string;
  @IsString() @MaxLength(150) titulo!: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsDateString() fecha_programada!: string;
  @IsIn(['VACUNACION', 'CONTROL_VETERINARIO', 'DESPARASITACION', 'ESTERILIZACION', 'MEDICACION', 'OTRO'])
  tipo!: 'VACUNACION' | 'CONTROL_VETERINARIO' | 'DESPARASITACION' | 'ESTERILIZACION' | 'MEDICACION' | 'OTRO';
  @IsOptional() @IsUUID() registro_vacunacion_id?: string;
}

export class UpdateRecordatorioDto {
  @IsOptional() @IsString() @MaxLength(150) titulo?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsDateString() fecha_programada?: string;
  @IsOptional() @IsIn(['VACUNACION', 'CONTROL_VETERINARIO', 'DESPARASITACION', 'ESTERILIZACION', 'MEDICACION', 'OTRO'])
  tipo?: 'VACUNACION' | 'CONTROL_VETERINARIO' | 'DESPARASITACION' | 'ESTERILIZACION' | 'MEDICACION' | 'OTRO';
  @IsOptional() @IsIn(['PROGRAMADO', 'ENVIADO', 'COMPLETADO', 'POSPUESTO', 'CANCELADO'])
  estado?: 'PROGRAMADO' | 'ENVIADO' | 'COMPLETADO' | 'POSPUESTO' | 'CANCELADO';
}
