import {UseCaseError} from '../../../../core/logic/UseCaseError';
import {Result} from '../../../../core/logic/Result';

export namespace CreatePayerErrors {
  export class PayerNotFoundError extends Result<UseCaseError> {
    constructor(manuscriptId: string) {
      super(false, {
        message: `Couldn't find a Manuscript for {${manuscriptId}}.`
      } as UseCaseError);
    }
  }

  export class NotAbleToCreatePayerError extends Result<UseCaseError> {
    constructor(manuscriptId: string) {
      super(false, {
        message: `Couldn't find a Manuscript for {${manuscriptId}}.`
      } as UseCaseError);
    }
  }

  export class InvoiceNotFoundError extends Result<UseCaseError> {
    constructor(invoiceId: string) {
      super(false, {
        message: `Couldn't find an Invoice for {${invoiceId}}.`
      } as UseCaseError);
    }
  }
}
