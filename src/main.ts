import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap()
  .then(() => {
    console.log('Server is running');
  })
  .catch((error) => {
    console.log(error);
  });
