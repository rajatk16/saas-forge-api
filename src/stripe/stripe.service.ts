import Stripe from 'stripe';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly stripe: Stripe,
  ) {
    this.stripe = new Stripe(this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'));
  }

  async createCustomer(email: string) {
    return this.stripe.customers.create({
      email,
    });
  }

  async getCustomer(customerId: string) {
    return this.stripe.customers.retrieve(customerId);
  }

  async updateCustomer(customerId: string, email?: string, metadata?: Record<string, string>) {
    return this.stripe.customers.update(customerId, {
      email,
      metadata,
    });
  }

  async deleteCustomer(customerId: string) {
    return this.stripe.customers.del(customerId);
  }

  async createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      cancel_url: cancelUrl,
      success_url: successUrl,
    });
  }

  async createBillingPortalSession(customerId: string, returnUrl: string) {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }
}
