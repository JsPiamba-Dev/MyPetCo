
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { cuentas_acceso_rol } from '@prisma/client';

// REGISTRO
export class RegisterDto {
  @IsEnum(cuentas_acceso_rol)
  rol: cuentas_acceso_rol;

  // Datos del propietario
  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === cuentas_acceso_rol.PROPIETARIO,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === cuentas_acceso_rol.PROPIETARIO,
  )
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  numero_documento?: string;

  @IsEmail()
  @MaxLength(254)
  correo: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena: string;

  // Autorización opcional para comunicaciones comerciales
  @IsOptional()
  @IsBoolean()
  autorizacion_promociones?: boolean;

  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === cuentas_acceso_rol.PROPIETARIO,
  )
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  // Datos generales del proveedor
  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === cuentas_acceso_rol.VETERINARIA ||
      dto.rol === cuentas_acceso_rol.EMPRESA,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre_comercial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono_contacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sitio_web?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  // Datos específicos de veterinaria
  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === cuentas_acceso_rol.VETERINARIA,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre_responsable?: string;

  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === cuentas_acceso_rol.VETERINARIA,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  registro_profesional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  horario_atencion?: string;

  @IsOptional()
  @IsString()
  servicios_clinicos?: string;

  // Datos específicos de empresa
  @ValidateIf(
    (dto: RegisterDto) =>
      dto.rol === cuentas_acceso_rol.EMPRESA,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  identificacion_tributaria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria_comercial?: string;
}

// INICIO DE SESIÓN
export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  correo: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena: string;
}

// SOLICITAR RECUPERACIÓN
export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  correo: string;
}

// RESTABLECER CONTRASEÑA
export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena: string;
}

// ACTUALIZAR PERFIL
export class UpdateProfileDto {
  // Propietario
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  // Datos generales del establecimiento
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre_comercial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono_contacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sitio_web?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descripcion?: string;

  // Datos de veterinaria
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre_responsable?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  registro_profesional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  horario_atencion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  servicios_clinicos?: string;

  // Datos de empresa
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  identificacion_tributaria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria_comercial?: string;
}

// CAMBIAR CORREO
export class ChangeEmailDto {
  @IsEmail()
  @MaxLength(254)
  correo: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasenaActual: string;
}

// CAMBIAR CONTRASEÑA CON SESIÓN AUTENTICADA
export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasenaActual: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  nuevaContrasena: string;
}