import { Body, Controller, Post } from '@nestjs/common';

import { StripeService } from '../stripe/stripe.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly stripeService: StripeService) {
    this.stripeService = stripeService;
  }

  @Post('create-customer')
  async createCustomer(@Body() body: { email: string }) {
    return this.stripeService.createCustomer(body.email);
  }
}
