import { UnexpectedError } from '../../../../core/logic/AppError';
import { Either } from '../../../../core/logic/Result';

import * as GenerateCompensatoryEventsErrors from './generateCompensatoryEventsErrors';

export type GenerateCompensatoryEventsResponse = Either<
  | GenerateCompensatoryEventsErrors.PublishInvoiceFinalizedError
  | GenerateCompensatoryEventsErrors.PublishInvoiceConfirmError
  | GenerateCompensatoryEventsErrors.PublishInvoicePayedError
  | GenerateCompensatoryEventsErrors.InvoiceIdRequiredError
  | UnexpectedError,
  void
>;
