import { JobData } from '@hindawi/sisif';

import {
  SendInvoiceCreditControlReminderUsecase,
  SendInvoiceCreditControlReminderDTO,
  QueuePayloads,
  Roles,
} from '@hindawi/shared';

import { Context } from '../../builders';
import { env } from '../../env';

export const invoiceCreditControlHandler = (
  payload: JobData<QueuePayloads.InvoiceReminderPayload>,
  appContext: Context
) => {
  const {
    repos: {
      sentNotifications,
      pausedReminder,
      invoiceItem,
      manuscript,
      catalog,
      invoice,
      coupon,
      waiver,
    },
    services: { emailService },
    loggerBuilder,
  } = appContext;
  const { recipientEmail, recipientName, invoiceId } = payload;

  const logger = loggerBuilder.getLogger(
    SendInvoiceCreditControlReminderUsecase.name
  );

  const usecase = new SendInvoiceCreditControlReminderUsecase(
    sentNotifications,
    pausedReminder,
    invoiceItem,
    manuscript,
    invoice,
    catalog,
    coupon,
    waiver,
    logger,
    emailService
  );
  const usecaseContext = {
    roles: [Roles.CHRON_JOB],
  };

  const request: SendInvoiceCreditControlReminderDTO = {
    notificationDisabled: env.scheduler.pauseCreditControlReminders,
    creditControlDelay: env.scheduler.creditControlReminderDelay,
    senderEmail: env.app.creditControlReminderSenderEmail,
    senderName: env.app.creditControlReminderSenderName,
    paymentDelay: env.scheduler.paymentReminderDelay,
    recipientEmail,
    recipientName,
    invoiceId,
  };

  usecase
    .execute(request, usecaseContext)
    .then((maybeResult) => {
      if (maybeResult.isLeft()) {
        logger.error(maybeResult.value.message, maybeResult.value);
      }
    })
    .catch((err) => {
      logger.error(err.message, err);
    });
};
