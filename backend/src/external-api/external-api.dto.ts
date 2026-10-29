import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExternalPetAnalyticsDto {
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
  @IsOptional() @IsIn(['PERRO', 'GATO']) especie?: 'PERRO' | 'GATO';
  @IsOptional() @IsString() @MaxLength(100) raza?: string;
}
