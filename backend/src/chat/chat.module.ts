import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { DetectionModule } from '../detection/detection.module';

@Module({
  imports: [ConfigModule, DetectionModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
