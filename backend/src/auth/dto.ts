
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @IsEmail()
  @MaxLength(254)
  correo: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  correo: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  correo: string;
}

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
