import { Manuscript } from '../../../manuscripts/domain/Manuscript';
import { CatalogItem } from '../../../journals/domain/CatalogItem';
import { Invoice } from '../../../invoices/domain/Invoice';

import { PaymentReminder } from '../../../../infrastructure/communication-channels/EmailService';

import { SendInvoiceCreditControlReminderDTO as DTO } from './sendInvoiceCreditControlReminderDTO';

export interface CompoundData extends DTO {
  manuscript: Manuscript;
  journal: CatalogItem;
  invoice: Invoice;
  paused: boolean;
}

export function constructCreditControlReminderData(
  data: CompoundData
): PaymentReminder {
  const { invoice, journal, manuscript } = data;

  return {
    manuscriptCustomId: manuscript.customId,
    catalogItem: journal,
    invoice,
    author: {
      email: data.recipientEmail,
      name: data.recipientName,
    },
    sender: {
      email: data.senderEmail,
      name: data.senderName,
    },
  };
}
