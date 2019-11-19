import { Either, Result } from '../../../../core/logic/Result';
import { AppError } from '../../../.././core/logic/AppError';

// import {UpdateTransactionErrors} from './updateTransactionErrors';

export type UpdateTransactionOnAcceptManuscriptResponse = Either<
  // | UpdateTransactionErrors.SomeBlahBlahError
  AppError.UnexpectedError,
  Result<void>
>;
