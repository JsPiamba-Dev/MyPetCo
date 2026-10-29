import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class ProductoDetalleDto {
  @IsString() @MaxLength(100) categoria!: string;
  @IsOptional() @IsIn(['PERRO', 'GATO']) especie_objetivo?: 'PERRO' | 'GATO';
  @IsOptional() @IsIn(['CACHORRO_GATITO', 'JOVEN', 'ADULTO', 'SENIOR', 'NO_ESPECIFICADA'])
  etapa_vida?: 'CACHORRO_GATITO' | 'JOVEN' | 'ADULTO' | 'SENIOR' | 'NO_ESPECIFICADA';
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999)
  precio?: number;
  @IsOptional() @IsString() @MaxLength(3) moneda?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500) enlace_compra?: string;
  @IsOptional() @IsString() @MaxLength(100) disponibilidad?: string;
}

export class ServicioDetalleDto {
  @IsString() @MaxLength(100) categoria!: string;
  @IsOptional() @IsIn(['PERRO', 'GATO']) especie_objetivo?: 'PERRO' | 'GATO';
  @IsOptional() @IsString() @MaxLength(60) modalidad?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999)
  precio_desde?: number;
  @IsOptional() @IsString() requisitos?: string;
}

export class CreatePublicacionDto {
  @IsString() @MaxLength(150) titulo!: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500) imagen?: string;

  @ValidateNested() @Type(() => ProductoDetalleDto)
  producto?: ProductoDetalleDto;

  @ValidateNested() @Type(() => ServicioDetalleDto)
  servicio?: ServicioDetalleDto;
}

export class ListPublicacionesDto {
  @IsOptional() @IsString() @MaxLength(120)
  q?: string;

  @IsOptional() @IsIn(['PRODUCTO', 'SERVICIO', 'CAMPANA'])
  tipo?: 'PRODUCTO' | 'SERVICIO' | 'CAMPANA';

  @IsOptional() @IsIn(['EMPRESA', 'VETERINARIA'])
  proveedor?: 'EMPRESA' | 'VETERINARIA';

  @IsOptional() @IsString() @MaxLength(100)
  ciudad?: string;

  @IsOptional() @IsIn(['PERRO', 'GATO'])
  especie?: 'PERRO' | 'GATO';
}
