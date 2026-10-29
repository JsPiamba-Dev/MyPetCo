
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePetDto, UpdatePetDto } from './dto';
import { PetsService } from './pets.service';

@UseGuards(JwtAuthGuard)
@Controller('pets')
export class PetsController {
  constructor(private readonly pets: PetsService) { }

  @Get()
  list(@Req() req: any) {
    return this.pets.list(req.user.sub);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreatePetDto) {
    return this.pets.create(req.user.sub, dto);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.pets.get(req.user.sub, id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePetDto,
  ) {
    return this.pets.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.pets.remove(req.user.sub, id);
  }
}
