import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantModule } from './tenant/tenant.module';
import { StripeModule } from './stripe/stripe.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production').required(),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        MONGODB_URI: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    TenantModule,
    StripeModule,
    BillingModule,
  ],
})
export class AppModule {}
