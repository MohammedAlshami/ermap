import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const DEFAULT_PORT = 3002;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  await app.listen(port);
  console.log(`[Nest] Application is running on: http://localhost:${port}`);
}
bootstrap();
