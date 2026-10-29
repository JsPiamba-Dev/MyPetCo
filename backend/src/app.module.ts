
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaService } from './prisma.service';

// Controladores existentes
import { AuthController } from './auth/auth.controller';
import { PetsController } from './pets/pets.controller';
import { VacunasController } from './vacunas/vacunas.controller';

// Servicios existentes
import { AuthService } from './auth/auth.service';
import { PetsService } from './pets/pets.service';
import { VacunasService } from './vacunas/vacunas.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Nuevos controladores
import { PublicacionesController } from './publicaciones/publicaciones.controller';
import { CitasController } from './citas/citas.controller';
import { ProveedoresController } from './proveedores/proveedores.controller';
import { RecordatoriosController } from './recordatorios/recordatorios.controller';
import { AdminController } from './admin/admin.controller';
import { ExternalApiController } from './external-api/external-api.controller';

// Nuevos servicios
import { PublicacionesService } from './publicaciones/publicaciones.service';
import { CitasService } from './citas/citas.service';
import { ProveedoresService } from './proveedores/proveedores.service';
import { RecordatoriosService } from './recordatorios/recordatorios.service';
import { AdminService } from './admin/admin.service';
import { AdminExternalTokensService } from './admin/admin-external-tokens.service';
import { ExternalApiService } from './external-api/external-api.service';

// Guard de la API externa
import { ExternalApiGuard } from './external-api/external-api.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'solo-desarrollo-cambiar-secreto',
      signOptions: { expiresIn: '8h' },
    }),
  ],

  controllers: [
    // Los que ya existían
    AuthController,
    PetsController,
    VacunasController,

    // Los nuevos
    PublicacionesController,
    CitasController,
    ProveedoresController,
    RecordatoriosController,
    AdminController,
    ExternalApiController,
  ],

  providers: [
    // Los que ya existían
    PrismaService,
    AuthService,
    PetsService,
    JwtAuthGuard,
    VacunasService,

    // Los nuevos
    PublicacionesService,
    CitasService,
    ProveedoresService,
    RecordatoriosService,
    AdminService,
    AdminExternalTokensService,
    ExternalApiService,
    ExternalApiGuard,
  ],
})
export class AppModule {}
