import { Either, Result } from '../../../../core/logic/Result';
import { AppError } from '../../../../core/logic/AppError';

import { SendInvoicePaymentReminderErrors } from './sendInvoicePaymentReminderErrors';

export type SendInvoicePaymentReminderResponse = Either<
  | SendInvoicePaymentReminderErrors.ManuscriptCustomIdRequiredError
  | SendInvoicePaymentReminderErrors.RecipientEmailRequiredError
  | SendInvoicePaymentReminderErrors.RecipientNameRequiredError
  | SendInvoicePaymentReminderErrors.SenderEmailRequiredError
  | SendInvoicePaymentReminderErrors.SenderNameRequiredError
  | SendInvoicePaymentReminderErrors.NotificationDbSaveError
  | SendInvoicePaymentReminderErrors.InvoiceIdRequiredError
  | SendInvoicePaymentReminderErrors.InvoiceNotFoundError
  | SendInvoicePaymentReminderErrors.RescheduleTaskFailed
  | SendInvoicePaymentReminderErrors.EmailSendingFailure
  | SendInvoicePaymentReminderErrors.ManuscriptNotFound
  | AppError.UnexpectedError,
  Result<void>
>;
