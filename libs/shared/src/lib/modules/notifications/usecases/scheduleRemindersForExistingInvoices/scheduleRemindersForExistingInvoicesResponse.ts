import { Either, Result } from '../../../../core/logic/Result';
import { AppError } from '../../../../core/logic/AppError';

import * as Errors from './scheduleRemindersForExistingInvoicesErrors';

export type ScheduleRemindersForExistingInvoicesResponse = Either<
  | Errors.CreditControlDisabledSettingRequiredError
  | Errors.GetInvoiceIdsWithoutPauseSettingsDbError
  | Errors.CouldNotGetTransactionForInvoiceError
  | Errors.ConfirmationQueueNameRequiredError
  | Errors.ScheduleCreditControlReminderError
  | Errors.ConfirmationDelayRequiredError
  | Errors.PaymentQueueNameRequiredError
  | Errors.CreditControlDelayIsRequired
  | Errors.PaymentDelayRequiredError
  | Errors.PauseDbError
  | AppError.UnexpectedError,
  Result<void>
>;
