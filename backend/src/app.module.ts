import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PetsController } from './pets/pets.controller';
import { PetsService } from './pets/pets.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { VacunasController } from './vacunas/vacunas.controller';
import { VacunasService } from './vacunas/vacunas.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'solo-desarrollo-cambiar-secreto', signOptions: { expiresIn: '8h' } }),
  ],
  controllers: [AuthController, PetsController, VacunasController],
  providers: [PrismaService, AuthService, PetsService, JwtAuthGuard, VacunasService],
})
export class AppModule {}
