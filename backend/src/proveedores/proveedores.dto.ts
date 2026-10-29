import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ListProveedoresDto {
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsIn(['EMPRESA', 'VETERINARIA']) tipo?: 'EMPRESA' | 'VETERINARIA';
}

export class UpdateProveedorDto {
  @IsOptional() @IsString() @MaxLength(150) nombre_comercial?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() @MaxLength(30) telefono_contacto?: string;
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
  @IsOptional() @IsString() @MaxLength(255) direccion?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(255) sitio_web?: string;
  @IsOptional() @IsString() @MaxLength(150) nombre_responsable?: string;
  @IsOptional() @IsString() @MaxLength(60) registro_profesional?: string;
  @IsOptional() @IsString() @MaxLength(255) horario_atencion?: string;
  @IsOptional() @IsString() servicios_clinicos?: string;
  @IsOptional() @IsString() @MaxLength(30) identificacion_tributaria?: string;
  @IsOptional() @IsString() @MaxLength(100) categoria_comercial?: string;
}
