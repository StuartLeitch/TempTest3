import { UnexpectedError } from '../../../../../core/logic/AppError';
import { Either } from '../../../../../core/logic/Either';

import * as Errors from './publishInvoiceCreated.errors';

export type PublishInvoiceCreatedResponse = Either<
  | Errors.InvoiceItemsRequiredError
  | Errors.ManuscriptRequiredError
  | Errors.InvoiceRequiredError
  | UnexpectedError,
  void
>;
