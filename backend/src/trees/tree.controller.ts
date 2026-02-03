import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TreeService, DetectResult } from './tree.service';

@Controller('api/trees')
export class TreeController {
  constructor(private readonly service: TreeService) {}

  @Post('detect')
  @UseInterceptors(FileInterceptor('image'))
  async detect(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<DetectResult> {
    if (!file?.buffer) {
      throw new BadRequestException('Missing image file (field: image)');
    }
    return this.service.detectTrees(file.buffer);
  }
}
