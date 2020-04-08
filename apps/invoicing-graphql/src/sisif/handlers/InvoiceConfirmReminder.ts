import { SisifJobTypes, JobData } from '@hindawi/sisif';
import {
  SendInvoiceConfirmationReminderUsecase,
  SendInvoiceConfirmationReminderDTO,
  QueuePayloads,
  Roles
} from '@hindawi/shared';

import { Logger } from '../../lib/logger';

import { env } from '../../env';

export const invoiceConfirmHandler = (
  payload: JobData<QueuePayloads.InvoiceReminderPayload>,
  appContext: any,
  loggerService: Logger
) => {
  const {
    repos: {
      sentNotifications,
      pausedReminder,
      invoiceItem,
      transaction,
      manuscript,
      invoice
    },
    services: { schedulingService, emailService, logger }
  } = appContext;
  const { manuscriptCustomId, recipientEmail, recipientName } = payload;

  const usecase = new SendInvoiceConfirmationReminderUsecase(
    sentNotifications,
    pausedReminder,
    invoiceItem,
    transaction,
    manuscript,
    invoice,
    logger,
    schedulingService,
    emailService
  );
  const usecaseContext = {
    roles: [Roles.ADMIN]
  };

  const request: SendInvoiceConfirmationReminderDTO = {
    job: {
      delay: env.scheduler.confirmationReminderDelay,
      queueName: env.scheduler.emailRemindersQueue
    },
    senderEmail: env.app.invoicePaymentEmailSenderAddress,
    senderName: env.app.invoicePaymentEmailSenderName,
    manuscriptCustomId,
    recipientEmail,
    recipientName
  };

  usecase.execute(request, usecaseContext).then(maybeResult => {
    if (maybeResult.isLeft()) {
      loggerService.error(maybeResult.value.errorValue().message);
      throw Error(maybeResult.value.errorValue().message);
    }
  });
};
