import { Module } from '@nestjs/common';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { BuildingsModule } from '../buildings/buildings.module';
import { TreesModule } from '../trees/trees.module';

@Module({
  imports: [BuildingsModule, TreesModule],
  controllers: [DetectionController],
  providers: [DetectionService],
  exports: [DetectionService],
})
export class DetectionModule {}
