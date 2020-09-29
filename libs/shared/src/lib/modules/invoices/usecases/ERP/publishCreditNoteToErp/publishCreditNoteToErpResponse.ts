import { Either } from '../../../../../core/logic/Result';
import { UnexpectedError } from '../../../../../core/logic/AppError';
import { ErpInvoiceResponse } from '../../../../../domain/services/ErpService';

export type PublishCreditNoteToErpResponse = Either<
  UnexpectedError,
  ErpInvoiceResponse
>;
