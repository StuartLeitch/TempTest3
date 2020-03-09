import { JobData } from '@hindawi/sisif';
import {
  SendInvoiceConfirmationReminderUsecase,
  SendInvoiceConfirmationReminderDTO,
  Roles
} from '@hindawi/shared';

import { env } from '../../env';

import { SisifJobTypes } from '../JobTypes';

interface Payload {
  manuscriptCustomId: string;
  recipientEmail: string;
  recipientName: string;
}

export const invoiceConfirmHandler = (
  payload: JobData<Payload>,
  appContext: any
) => {
  const {
    repos: { sentNotifications, invoice, manuscript, invoiceItem },
    services: { schedulingService, emailService }
  } = appContext;
  const { manuscriptCustomId, recipientEmail, recipientName } = payload;

  const usecase = new SendInvoiceConfirmationReminderUsecase(
    sentNotifications,
    invoiceItem,
    manuscript,
    invoice,
    schedulingService,
    emailService
  );
  const usecaseContext = {
    roles: [Roles.PAYER]
  };

  const request: SendInvoiceConfirmationReminderDTO = {
    job: {
      delay: env.scheduler.confirmationReminderDelay,
      queName: env.scheduler.notificationsQueue,
      type: SisifJobTypes.InvoiceConfirmReminder
    },
    senderEmail: env.app.invoicePaymentEmailSenderAddress,
    senderName: env.app.invoicePaymentEmailSenderName,
    manuscriptCustomId,
    recipientEmail,
    recipientName
  };

  usecase.execute(request, usecaseContext).then(maybeResult => {
    if (maybeResult.isLeft()) {
      console.error(maybeResult.value.errorValue());
    }
  });
};
