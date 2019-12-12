import { Context } from '../context';
import { config } from '../config';

import { AfterInvoiceCreatedEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceCreatedEvents';
import { AfterInvoiceActivated } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceActivatedEvent';
import { AfterInvoicePaidEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoicePaidEvents';
import { PublishInvoiceConfirmed } from 'libs/shared/src/lib/modules/invoices/usecases/publishInvoiceConfirmed';
import { PublishInvoicePaid } from 'libs/shared/src/lib/modules/invoices/usecases/PublishInvoicePaid/publishInvoicePaid';
import { SQSPublishServiceContract } from 'libs/shared/src/lib/domain/services/SQSPublishService';
import { PublishInvoiceToErpUsecase } from 'libs/shared/src/lib/modules/invoices/usecases/publishInvoiceToErp/publishInvoiceToErp';
import { PublishInvoiceCreatedUsecase } from 'libs/shared/src/lib/modules/invoices/usecases/publishInvoiceCreated/publishInvoiceCreated';

export const registerDomainEvents = (
  context: Context,
  queue: SQSPublishServiceContract
) => {
  const {
    repos: { invoice, invoiceItem, manuscript, payer, address, catalog },
    emailService,
    erpService
  } = context;

  const publishInvoiceToErpUsecase = new PublishInvoiceToErpUsecase(
    invoice,
    invoiceItem,
    payer,
    address,
    manuscript,
    catalog,
    erpService
  );

  const publishInvoiceCreatedUsecase = new PublishInvoiceCreatedUsecase(queue);
  const publishInvoiceActivated = new PublishInvoiceConfirmed(queue);
  const publishInvoicePaid = new PublishInvoicePaid(queue);

  // Registering Invoice Events
  const createdEventListener = new AfterInvoiceCreatedEvent(
    invoice,
    invoiceItem,
    manuscript,
    publishInvoiceCreatedUsecase
  );
  const activatedEventListener = new AfterInvoiceActivated(
    invoiceItem,
    payer,
    address,
    manuscript,
    publishInvoiceActivated,
    publishInvoiceToErpUsecase
  );
  const paidEventListener = new AfterInvoicePaidEvent(
    invoice,
    invoiceItem,
    manuscript,
    publishInvoicePaid
  );

  return;
};
