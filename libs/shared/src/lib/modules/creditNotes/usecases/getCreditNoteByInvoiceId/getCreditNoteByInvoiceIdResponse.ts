import { Either } from '../../../../core/logic/Either';
import { GuardFailure } from '../../../../core/logic/GuardFailure';
import { UnexpectedError } from '../../../../core/logic/AppError';

import * as Errors from './getCreditNoteByInvoiceIdErrors';
import { CreditNote } from '../../domain/CreditNote';

export type GetCreditNoteByInvoiceIdResponse = Either<
  Errors.CreditNoteNotFoundError | UnexpectedError | GuardFailure,
  CreditNote
>;
