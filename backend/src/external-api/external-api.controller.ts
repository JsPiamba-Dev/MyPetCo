import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ExternalApiGuard } from './external-api.guard';
import { ExternalApiService } from './external-api.service';
import { ExternalPetAnalyticsDto } from './external-api.dto';

@Controller('external/v1/analytics')
@UseGuards(ExternalApiGuard)
export class ExternalApiController {
  constructor(private readonly service: ExternalApiService) {}

  @Get('pets')
  pets(@Query() filtros: ExternalPetAnalyticsDto) {
    return this.service.aggregatedPets(filtros);
  }
}
