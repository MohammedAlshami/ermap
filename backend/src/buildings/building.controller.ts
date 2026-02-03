import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BuildingService, DetectResult } from './building.service';

@Controller('api/buildings')
export class BuildingController {
  constructor(private readonly service: BuildingService) {}

  @Post('detect')
  @UseInterceptors(FileInterceptor('image'))
  async detect(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<DetectResult> {
    if (!file?.buffer) {
      throw new BadRequestException('Missing image file (field: image)');
    }
    return this.service.detectBuildings(file.buffer);
  }
}
