
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  cuentas_acceso_estado,
  cuentas_acceso_rol,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // REGISTRO
  async register(dto: RegisterDto) {
    const correo = dto.correo.toLowerCase().trim();

    const existente = await this.prisma.cuentas_acceso.findUnique({
      where: { correo },
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe una cuenta con ese correo',
      );
    }

    const hash = await bcrypt.hash(dto.contrasena, 12);

    const cuenta = await this.prisma.cuentas_acceso.create({
      data: {
        id: randomUUID(),
        correo,
        hash_contrasena: hash,
        rol: cuentas_acceso_rol.PROPIETARIO,
        estado: cuentas_acceso_estado.ACTIVA,
        usuarios: {
          create: {
            nombre: dto.nombre.trim(),
            preferencias_usuario: {
              create: {
                id: randomUUID(),
              },
            },
          },
        },
      },
      include: {
        usuarios: {
          select: {
            cuenta_id: true,
            nombre: true,
          },
        },
      },
    });

    if (!cuenta.usuarios) {
      throw new UnauthorizedException(
        'No se pudo crear el perfil del usuario',
      );
    }

    return this.makeSession(
      cuenta.id,
      cuenta.usuarios.nombre,
      cuenta.correo,
    );
  }

  // LOGIN
  async login(dto: LoginDto) {
    const correo = dto.correo.toLowerCase().trim();

    const cuenta = await this.prisma.cuentas_acceso.findUnique({
      where: { correo },
      include: { usuarios: true },
    });

    if (
      !cuenta ||
      !(await bcrypt.compare(
        dto.contrasena,
        cuenta.hash_contrasena,
      ))
    ) {
      throw new UnauthorizedException(
        'Correo o contraseña incorrectos',
      );
    }

    if (cuenta.estado !== cuentas_acceso_estado.ACTIVA) {
      throw new ForbiddenException(
        'La cuenta no está activa',
      );
    }

    await this.prisma.cuentas_acceso.update({
      where: { id: cuenta.id },
      data: { ultimo_acceso: new Date() },
    });

    return {
      ...this.makeSession(
        cuenta.id,
        cuenta.usuarios?.nombre ?? '',
        cuenta.correo,
      ),
    };
  }

  // PERFIL DEL USUARIO AUTENTICADO
  async me(userId: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { cuenta_id: userId },
      select: {
        cuenta_id: true,
        nombre: true,
        telefono: true,
        ciudad: true,
        direccion: true,
        cuentas_acceso: {
          select: {
            correo: true,
            estado: true,
            rol: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException(
        'No se encontró el usuario',
      );
    }

    return {
      id: usuario.cuenta_id,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      ciudad: usuario.ciudad,
      direccion: usuario.direccion,
      cuenta: usuario.cuentas_acceso,
    };
  }

  // SOLICITAR RECUPERACIÓN
  async forgotPassword(dto: ForgotPasswordDto) {
    const correo = dto.correo.toLowerCase().trim();

    const respuesta = {
      message:
        'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.',
    };

    const cuenta = await this.prisma.cuentas_acceso.findUnique({
      where: { correo },
      select: { id: true },
    });

    if (!cuenta) {
      return respuesta;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    await this.prisma.cuentas_acceso.update({
      where: { id: cuenta.id },
      data: {
        token_recuperacion_hash: tokenHash,
        token_recuperacion_expira: new Date(
          Date.now() + 15 * 60 * 1000,
        ),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      const frontendUrl =
        process.env.FRONTEND_URL ?? 'http://localhost:3000';

      const link = new URL('/reset-password', frontendUrl);
      link.searchParams.set('token', token);

      console.info(
        '[MyPetCo] Enlace de recuperación (desarrollo):',
      );
      console.info(link.toString());
    }

    return respuesta;
  }

  // RESTABLECER CONTRASEÑA
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const cuenta = await this.prisma.cuentas_acceso.findFirst({
      where: {
        token_recuperacion_hash: tokenHash,
        token_recuperacion_expira: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!cuenta) {
      throw new BadRequestException(
        'El enlace no es válido o ha caducado.',
      );
    }

    const hash = await bcrypt.hash(dto.contrasena, 12);

    const resultado = await this.prisma.cuentas_acceso.updateMany({
      where: {
        id: cuenta.id,
        token_recuperacion_hash: tokenHash,
        token_recuperacion_expira: { gt: new Date() },
      },
      data: {
        hash_contrasena: hash,
        token_recuperacion_hash: null,
        token_recuperacion_expira: null,
      },
    });

    if (resultado.count !== 1) {
      throw new BadRequestException(
        'El enlace no es válido o ha caducado.',
      );
    }

    return {
      message: 'La contraseña se ha actualizado correctamente.',
    };
  }

  // CREAR SESIÓN
  private makeSession(
    id: string,
    nombre: string,
    correo: string,
  ) {
    const access_token = this.jwt.sign({
      sub: id,
      correo,
    });

    return {
      access_token,
      user: { id, nombre, correo },
    };
  }
}
