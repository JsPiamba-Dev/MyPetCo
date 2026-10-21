import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PetsController } from './pets/pets.controller';
import { PetsService } from './pets/pets.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'solo-desarrollo-cambiar-secreto', signOptions: { expiresIn: '8h' } }),
  ],
  controllers: [AuthController, PetsController],
  providers: [PrismaService, AuthService, PetsService, JwtAuthGuard],
})
export class AppModule {}
