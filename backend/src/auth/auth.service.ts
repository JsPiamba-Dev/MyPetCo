
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

type AuthUser = {
  id: string;
  nombre: string;
  correo: string;
  rol: cuentas_acceso_rol;
};

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
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe una cuenta con ese correo.',
      );
    }

    // El registro público nunca debe permitir crear administradores.
    const rol = dto.rol ?? cuentas_acceso_rol.PROPIETARIO;

    if (rol === cuentas_acceso_rol.ADMINISTRADOR) {
      throw new ForbiddenException(
        'No está permitido registrar administradores públicamente.',
      );
    }

    const hash = await bcrypt.hash(dto.contrasena, 12);
    const id = randomUUID();

    if (rol === cuentas_acceso_rol.PROPIETARIO) {
      const cuenta = await this.prisma.cuentas_acceso.create({
        data: {
          id,
          correo,
          hash_contrasena: hash,
          rol,
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
              nombre: true,
            },
          },
        },
      });

      if (!cuenta.usuarios) {
        throw new BadRequestException(
          'No se pudo crear el perfil del propietario.',
        );
      }

      return this.makeSession(
        cuenta.id,
        cuenta.usuarios.nombre,
        cuenta.correo,
        cuenta.rol,
      );
    }

    if (
      rol === cuentas_acceso_rol.VETERINARIA ||
      rol === cuentas_acceso_rol.EMPRESA
    ) {
      if (!dto.nombre_comercial?.trim()) {
        throw new BadRequestException(
          'El nombre comercial es obligatorio para proveedores.',
        );
      }

      if (
        rol === cuentas_acceso_rol.VETERINARIA &&
        (!dto.nombre_responsable?.trim() ||
          !dto.registro_profesional?.trim())
      ) {
        throw new BadRequestException(
          'La veterinaria requiere un responsable y un registro profesional.',
        );
      }

      if (
        rol === cuentas_acceso_rol.EMPRESA &&
        !dto.identificacion_tributaria?.trim()
      ) {
        throw new BadRequestException(
          'La identificación tributaria es obligatoria para empresas.',
        );
      }

      const datosProveedor = {
        nombre_comercial: dto.nombre_comercial.trim(),
        descripcion: dto.descripcion?.trim() || null,
        telefono_contacto: dto.telefono_contacto?.trim() || null,
        ciudad: dto.ciudad?.trim() || null,
        direccion: dto.direccion?.trim() || null,
        sitio_web: dto.sitio_web?.trim() || null,
      };

      if (rol === cuentas_acceso_rol.VETERINARIA) {
        const cuenta = await this.prisma.cuentas_acceso.create({
          data: {
            id,
            correo,
            hash_contrasena: hash,
            rol,
            estado: cuentas_acceso_estado.ACTIVA,
            proveedores: {
              create: {
                ...datosProveedor,
                veterinarias: {
                  create: {
                    nombre_responsable:
                      dto.nombre_responsable!.trim(),
                    registro_profesional:
                      dto.registro_profesional!.trim(),
                    horario_atencion:
                      dto.horario_atencion?.trim() || null,
                    servicios_clinicos:
                      dto.servicios_clinicos?.trim() || null,
                  },
                },
              },
            },
          },
          include: {
            proveedores: {
              select: {
                nombre_comercial: true,
              },
            },
          },
        });

        if (!cuenta.proveedores) {
          throw new BadRequestException(
            'No se pudo crear el perfil de la veterinaria.',
          );
        }

        return this.makeSession(
          cuenta.id,
          cuenta.proveedores.nombre_comercial,
          cuenta.correo,
          cuenta.rol,
        );
      }

      const cuenta = await this.prisma.cuentas_acceso.create({
        data: {
          id,
          correo,
          hash_contrasena: hash,
          rol,
          estado: cuentas_acceso_estado.ACTIVA,
          proveedores: {
            create: {
              ...datosProveedor,
              empresas: {
                create: {
                  identificacion_tributaria:
                    dto.identificacion_tributaria!.trim(),
                  categoria_comercial:
                    dto.categoria_comercial?.trim() || null,
                },
              },
            },
          },
        },
        include: {
          proveedores: {
            select: {
              nombre_comercial: true,
            },
          },
        },
      });

      if (!cuenta.proveedores) {
        throw new BadRequestException(
          'No se pudo crear el perfil de la empresa.',
        );
      }

      return this.makeSession(
        cuenta.id,
        cuenta.proveedores.nombre_comercial,
        cuenta.correo,
        cuenta.rol,
      );
    }

    throw new BadRequestException('El rol seleccionado no es válido.');
  }

  // LOGIN
  async login(dto: LoginDto) {
    const correo = dto.correo.toLowerCase().trim();

    const cuenta = await this.prisma.cuentas_acceso.findUnique({
      where: { correo },
      include: {
        usuarios: true,
        proveedores: {
          include: {
            veterinarias: true,
            empresas: true,
          },
        },
      },
    });

    if (
      !cuenta ||
      !(await bcrypt.compare(dto.contrasena, cuenta.hash_contrasena))
    ) {
      throw new UnauthorizedException(
        'Correo o contraseña incorrectos.',
      );
    }

    if (cuenta.estado !== cuentas_acceso_estado.ACTIVA) {
      throw new ForbiddenException('La cuenta no está activa.');
    }

    // Comprobar que el perfil corresponda al rol de la cuenta.
    if (
      cuenta.rol === cuentas_acceso_rol.PROPIETARIO &&
      !cuenta.usuarios
    ) {
      throw new ForbiddenException(
        'La cuenta no tiene un perfil de propietario válido.',
      );
    }

    if (
      cuenta.rol === cuentas_acceso_rol.VETERINARIA &&
      !cuenta.proveedores?.veterinarias
    ) {
      throw new ForbiddenException(
        'La cuenta no tiene un perfil de veterinaria válido.',
      );
    }

    if (
      cuenta.rol === cuentas_acceso_rol.EMPRESA &&
      !cuenta.proveedores?.empresas
    ) {
      throw new ForbiddenException(
        'La cuenta no tiene un perfil de empresa válido.',
      );
    }

    if (
      cuenta.rol === cuentas_acceso_rol.ADMINISTRADOR &&
      (cuenta.usuarios || cuenta.proveedores)
    ) {
      // No se asume que el administrador deba tener perfil de propietario
      // o proveedor. Si tu modelo permite ambos perfiles, ajusta esta regla.
    }

    await this.prisma.cuentas_acceso.update({
      where: { id: cuenta.id },
      data: { ultimo_acceso: new Date() },
    });

    return this.makeSession(
      cuenta.id,
      cuenta.usuarios?.nombre ??
        cuenta.proveedores?.nombre_comercial ??
        'Administrador',
      cuenta.correo,
      cuenta.rol,
    );
  }

  // PERFIL DEL USUARIO AUTENTICADO
  async me(userId: string) {
    const cuenta = await this.prisma.cuentas_acceso.findUnique({
      where: { id: userId },
      include: {
        usuarios: true,
        proveedores: {
          include: {
            veterinarias: true,
            empresas: true,
          },
        },
      },
    });

    if (!cuenta) {
      throw new UnauthorizedException(
        'No se encontró la cuenta autenticada.',
      );
    }

    const usuario = cuenta.usuarios;
    const proveedor = cuenta.proveedores;

    if (
      cuenta.rol === cuentas_acceso_rol.PROPIETARIO &&
      !usuario
    ) {
      throw new UnauthorizedException(
        'La cuenta no tiene un perfil de propietario.',
      );
    }

    if (
      cuenta.rol === cuentas_acceso_rol.VETERINARIA &&
      !proveedor?.veterinarias
    ) {
      throw new UnauthorizedException(
        'La cuenta no tiene un perfil de veterinaria.',
      );
    }

    if (
      cuenta.rol === cuentas_acceso_rol.EMPRESA &&
      !proveedor?.empresas
    ) {
      throw new UnauthorizedException(
        'La cuenta no tiene un perfil de empresa.',
      );
    }

    return {
      id: cuenta.id,
      nombre:
        usuario?.nombre ??
        proveedor?.nombre_comercial ??
        'Administrador',
      telefono: usuario?.telefono ?? null,
      ciudad: usuario?.ciudad ?? proveedor?.ciudad ?? null,
      direccion: usuario?.direccion ?? proveedor?.direccion ?? null,
      cuenta: {
        correo: cuenta.correo,
        estado: cuenta.estado,
        rol: cuenta.rol,
      },
      proveedor: proveedor
        ? {
            nombre_comercial: proveedor.nombre_comercial,
            descripcion: proveedor.descripcion,
            telefono_contacto: proveedor.telefono_contacto,
            ciudad: proveedor.ciudad,
            direccion: proveedor.direccion,
            sitio_web: proveedor.sitio_web,
            estado_proveedor: proveedor.estado_proveedor,
            veterinaria: proveedor.veterinarias
              ? {
                  nombre_responsable:
                    proveedor.veterinarias.nombre_responsable,
                  registro_profesional:
                    proveedor.veterinarias.registro_profesional,
                  horario_atencion:
                    proveedor.veterinarias.horario_atencion,
                  servicios_clinicos:
                    proveedor.veterinarias.servicios_clinicos,
                }
              : null,
            empresa: proveedor.empresas
              ? {
                  identificacion_tributaria:
                    proveedor.empresas.identificacion_tributaria,
                  categoria_comercial:
                    proveedor.empresas.categoria_comercial,
                }
              : null,
          }
        : null,
    };
  }

  // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  async forgotPassword(dto: ForgotPasswordDto) {
    const correo = dto.correo.toLowerCase().trim();

    const respuesta = {
      message:
        'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.',
    };

    const cuenta = await this.prisma.cuentas_acceso.findUnique({
      where: { correo },
      select: {
        id: true,
        estado: true,
      },
    });

    if (
      !cuenta ||
      cuenta.estado !== cuentas_acceso_estado.ACTIVA
    ) {
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
        link.toString(),
      );
    }

    // En producción, enviar este enlace por correo electrónico.
    return respuesta;
  }

  // RESTABLECER CONTRASEÑA
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const ahora = new Date();

    const cuenta = await this.prisma.cuentas_acceso.findFirst({
      where: {
        token_recuperacion_hash: tokenHash,
        token_recuperacion_expira: { gt: ahora },
      },
      select: { id: true },
    });

    if (!cuenta) {
      throw new BadRequestException(
        'El enlace no es válido o ha caducado.',
      );
    }

    const hash = await bcrypt.hash(dto.contrasena, 12);

    // Actualización condicional para evitar reutilizar un token vencido
    // o consumido por otra petición.
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
    rol: cuentas_acceso_rol,
  ) {
    const access_token = this.jwt.sign({
      sub: id,
      correo,
      rol,
    });

    return {
      access_token,
      user: {
        id,
        nombre,
        correo,
        rol,
      } satisfies AuthUser,
    };
  }
}
