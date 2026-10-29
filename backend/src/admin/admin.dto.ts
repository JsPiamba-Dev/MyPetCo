import { ArrayMinSize, ArrayUnique, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @IsString() @MaxLength(150) nombre!: string;
  @IsEmail() @MaxLength(255) correo!: string;
  @IsString() @MinLength(10) @MaxLength(100) password!: string;
  @IsIn(['PROPIETARIO', 'VETERINARIA', 'EMPRESA', 'ADMINISTRADOR'])
  rol!: 'PROPIETARIO' | 'VETERINARIA' | 'EMPRESA' | 'ADMINISTRADOR';
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
}

export class CreateExternalTokenDto {
  @IsString() @MaxLength(120) client_name!: string;
  @IsString() @MaxLength(120) contract_reference!: string;
  @IsString() @MaxLength(500) purpose!: string;
  @IsInt() @Min(1) @Max(365) expires_in_days!: number;
  @IsArray() @ArrayMinSize(1) @ArrayUnique()
  @IsIn(['analytics:read', 'pets:aggregate'], { each: true })
  scopes!: Array<'analytics:read' | 'pets:aggregate'>;
}

export class ListAdminUsersDto {
  @IsOptional() @IsString() @MaxLength(150) q?: string;
  @IsOptional() @IsIn(['PROPIETARIO', 'VETERINARIA', 'EMPRESA', 'ADMINISTRADOR']) rol?: string;
  @IsOptional() @IsIn(['PENDIENTE_VERIFICACION', 'ACTIVA', 'SUSPENDIDA', 'DESACTIVADA']) estado?: string;
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
}

export class PetAnalyticsDto {
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
  @IsOptional() @IsIn(['PERRO', 'GATO']) especie?: 'PERRO' | 'GATO';
  @IsOptional() @IsString() @MaxLength(100) raza?: string;
}

export class UpdateAdminUserDto {
  @IsOptional() @IsString() @MaxLength(150) nombre?: string;
  @IsOptional() @IsIn(['PROPIETARIO', 'VETERINARIA', 'EMPRESA', 'ADMINISTRADOR'])
  rol?: 'PROPIETARIO' | 'VETERINARIA' | 'EMPRESA' | 'ADMINISTRADOR';
  @IsOptional() @IsIn(['PENDIENTE_VERIFICACION', 'ACTIVA', 'SUSPENDIDA', 'DESACTIVADA'])
  estado?: 'PENDIENTE_VERIFICACION' | 'ACTIVA' | 'SUSPENDIDA' | 'DESACTIVADA';
  @IsOptional() @IsString() @MaxLength(100) ciudad?: string;
}
