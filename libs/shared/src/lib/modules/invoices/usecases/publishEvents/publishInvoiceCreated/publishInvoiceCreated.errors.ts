import { UseCaseError } from '../../../../../core/logic/UseCaseError';
import { Result } from '../../../../../core/logic/Result';

export class ManuscriptRequiredError extends Result<UseCaseError> {
  constructor() {
    super(false, {
      message: `Manuscript is required.`,
    });
  }
}

export class InvoiceItemsRequiredError extends Result<UseCaseError> {
  constructor() {
    super(false, {
      message: `Invoice items are required.`,
    });
  }
}

export class InvoiceRequiredError extends Result<UseCaseError> {
  constructor() {
    super(false, {
      message: `Invoice is required.`,
    });
  }
}
