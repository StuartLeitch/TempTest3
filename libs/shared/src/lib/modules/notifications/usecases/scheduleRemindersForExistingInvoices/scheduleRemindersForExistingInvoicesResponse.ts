import { Either, Result } from '../../../../core/logic/Result';
import { UnexpectedError } from '../../../../core/logic/AppError';

import * as ScheduleRemindersForExistingInvoicesErrors from './scheduleRemindersForExistingInvoicesErrors';

export type ScheduleRemindersForExistingInvoicesResponse = Either<
  | ScheduleRemindersForExistingInvoicesErrors.GetInvoiceIdsWithoutPauseSettingsDbError
  | ScheduleRemindersForExistingInvoicesErrors.CouldNotGetTransactionForInvoiceError
  | ScheduleRemindersForExistingInvoicesErrors.ConfirmationQueueNameRequiredError
  | ScheduleRemindersForExistingInvoicesErrors.ScheduleCreditControlReminderError
  | ScheduleRemindersForExistingInvoicesErrors.ConfirmationDelayRequiredError
  | ScheduleRemindersForExistingInvoicesErrors.PaymentQueueNameRequiredError
  | ScheduleRemindersForExistingInvoicesErrors.CreditControlDelayIsRequired
  | ScheduleRemindersForExistingInvoicesErrors.PaymentDelayRequiredError
  | ScheduleRemindersForExistingInvoicesErrors.PauseDbError
  | UnexpectedError,
  Result<void>
>;
