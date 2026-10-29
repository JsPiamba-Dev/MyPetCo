
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Max,
} from 'class-validator';

import {
  mascotas_especie,
  mascotas_sexo,
} from '@prisma/client';

export class CreatePetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre: string;

  @IsEnum(mascotas_especie)
  especie: mascotas_especie;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  raza?: string;

  @IsOptional()
  @IsEnum(mascotas_sexo)
  sexo?: mascotas_sexo;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  pesoKg?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4294967295)
  edadAproximadaMeses?: number;

  @IsOptional()
  @IsBoolean()
  esterilizada?: boolean;

  @IsOptional()
  @IsDateString()
  fechaEsterilizacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  foto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  enfermedadesAdquiridas?: string | null;
}

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsEnum(mascotas_especie)
  especie?: mascotas_especie;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  raza?: string;

  @IsOptional()
  @IsEnum(mascotas_sexo)
  sexo?: mascotas_sexo;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  pesoKg?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4294967295)
  edadAproximadaMeses?: number;

  @IsOptional()
  @IsBoolean()
  esterilizada?: boolean;

  @IsOptional()
  @IsDateString()
  fechaEsterilizacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  foto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  enfermedadesAdquiridas?: string | null;
}
