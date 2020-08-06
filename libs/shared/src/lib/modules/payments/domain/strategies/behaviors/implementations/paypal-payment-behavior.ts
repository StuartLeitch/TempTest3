import { StrategyError } from '../../../../../../core/logic/strategy-error';
import { Either } from '../../../../../../core/logic/Either';

import { ExternalOrderId } from '../../../../../../domain/external-order-id';
import {
  PayPalServiceContract,
  PayPalOrderRequest,
} from '../../../../../../domain/services/payment/paypal-service';

import { PaymentBehavior, PaymentDTO } from '../payment-behavior';

export class PayPalPaymentBehavior extends PaymentBehavior {
  constructor(private paypalService: PayPalServiceContract) {
    super();
  }

  async makePayment(
    request: PaymentDTO
  ): Promise<Either<StrategyError, ExternalOrderId>> {
    const transactionData: PayPalOrderRequest = {
      invoiceReferenceNumber: request.invoiceReferenceNumber,
      manuscriptCustomId: request.manuscriptCustomId,
      paymentTotal: request.invoiceTotal,
    };

    return this.paypalService.createOrder(transactionData);
  }
}
