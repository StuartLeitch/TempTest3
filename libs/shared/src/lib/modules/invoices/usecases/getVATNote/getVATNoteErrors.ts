import { UseCaseError } from '../../../../core/logic/UseCaseError';
import { Result } from '../../../../core/logic/Result';

export class PayerNotFoundError extends Result<UseCaseError> {
  constructor(invoiceId: string) {
    super(false, {
      message: `Could not find a Payer associated with Invoice id {${invoiceId}}.`
    } as UseCaseError);
  }
}

// export class InvoiceHasNoItems extends Result<UseCaseError> {
//   constructor(invoiceItemId: string) {
//     super(false, {
//       message: `The Invoice with Invoice id {${invoiceItemId}} has no Invoice Items.`
//     } as UseCaseError);
//   }
// }