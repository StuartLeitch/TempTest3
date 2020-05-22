import { UseCaseError } from '../../../../../core/logic/UseCaseError';
import { Result } from '../../../../../core/logic/Result';

export class InputNotProvidedError extends Result<UseCaseError> {
  constructor() {
    super(false, {
      message:
        'The input provided was incomplete, please provide valid values for: Invoice, InvoiceItems, Manuscript, Payer and Address',
    });
  }
}
