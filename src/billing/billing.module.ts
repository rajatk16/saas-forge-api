import { Module } from '@nestjs/common';

import { StripeModule } from '../stripe/stripe.module';
import { BillingController } from './billing.controller';

@Module({
  imports: [StripeModule],
  controllers: [BillingController],
})
export class BillingModule {}
