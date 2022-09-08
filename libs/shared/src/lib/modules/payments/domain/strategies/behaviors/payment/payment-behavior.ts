import { StrategyError } from '../../../../../../core/logic/strategy-error';
import { Behavior } from '../../../../../../core/logic/strategy';
import { Either } from '../../../../../../core/logic/Either';

import { ExternalOrderId } from '../../../external-order-id';
import { PaymentStatus } from '../../../Payment';

export interface PaymentDTO {
  netAmountBeforeDiscount: number;
  invoiceReferenceNumber: string;
  payerIdentification: string;
  manuscriptCustomId: string;
  paymentReference: string;
  discountAmount: number;
  invoiceTotal: number;
  invoiceId: string;
  netAmount: number;
  vatAmount: number;
}

export interface PaymentResponse {
  foreignPaymentId: ExternalOrderId;
  status: PaymentStatus;
  authorizationCode?: string;
  cardLastDigits?: string;
}

export abstract class PaymentBehavior implements Behavior {
  readonly type = Symbol.for('@PaymentBehavior');

  abstract makePayment(
    request: PaymentDTO
  ): Promise<Either<StrategyError, PaymentResponse>>;
}
