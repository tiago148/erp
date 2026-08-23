import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SerializeDecimalsInterceptor } from './common/serialize-decimals.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // FRONTEND_URL aceita uma ou mais origens separadas por virgula (ex: para
  // liberar staging e producao ao mesmo tempo), sem precisar editar codigo
  // a cada novo ambiente.
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new SerializeDecimalsInterceptor());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend rodando em http://localhost:${port}`);
}
bootstrap();
