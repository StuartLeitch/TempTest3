import { UnexpectedError } from '../../../../../core/logic/AppError';
import { Either } from '../../../../../core/logic/Either';

import { ErpRevRecResponse } from '../../../../../domain/services/ErpService';

export type RetryRevenueRecognitionNetsuiteErpInvoicesResponse = Either<
  UnexpectedError,
  ErpRevRecResponse[]
>;
