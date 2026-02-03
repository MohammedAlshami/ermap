import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { BuildingsModule } from './buildings/buildings.module';
import { TreesModule } from './trees/trees.module';
import { DetectionModule } from './detection/detection.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ChatModule,
    BuildingsModule,
    TreesModule,
    DetectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
