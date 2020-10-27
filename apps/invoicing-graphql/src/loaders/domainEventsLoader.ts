/* eslint-disable @nrwl/nx/enforce-module-boundaries */
// /* eslint-disable max-len */

import {
  MicroframeworkLoader,
  MicroframeworkSettings,
} from 'microframework-w3tec';

import { NoOpUseCase } from '../../../../libs/shared/src/lib/core/domain/NoOpUseCase';
import { PublishInvoiceCreditedUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoiceCredited/publishInvoiceCredited';
import { PublishInvoiceDraftCreatedUseCase } from 'libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoiceDraftCreated';
import { PublishInvoiceDraftDeletedUseCase } from 'libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoiceDraftDeleted';
import { PublishInvoiceDraftDueAmountUpdatedUseCase } from 'libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoiceDraftDueAmountUpdated';
import { PublishInvoiceCreatedUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoiceCreated/publishInvoiceCreated';
import { PublishCreditNoteToErpUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/ERP/publishCreditNoteToErp/publishCreditNoteToErp';
import { PublishInvoiceToErpUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/ERP/publishInvoiceToErp/publishInvoiceToErp';
import { PublishInvoiceConfirmedUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoiceConfirmed';
import { PublishInvoiceFinalizedUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoiceFinalized';
import { PublishPaymentToErpUsecase } from '../../../../libs/shared/src/lib/modules/payments/usecases/publishPaymentToErp/publishPaymentToErp';
import { PublishInvoicePaidUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/publishEvents/publishInvoicePaid';

import { AfterInvoiceCreditNoteCreatedEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceCreditNoteCreatedEvents';
import { AfterInvoiceDraftDueAmountUpdatedEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceDueAmountUpdateEvent';
import { AfterInvoiceDraftDeletedEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceDraftDeletedEvent';
import { AfterInvoiceDraftCreatedEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceDraftCreatedEvent';
import { AfterInvoiceCreatedEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceCreatedEvents';
import { AfterInvoiceConfirmed } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/afterInvoiceConfirmedEvent';
import { AfterInvoiceFinalized } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoiceFinalizedEvent';
import { AfterInvoicePaidEvent } from '../../../../libs/shared/src/lib/modules/invoices/subscriptions/AfterInvoicePaidEvents';
import { AfterPaymentCompleted } from './../../../../libs/shared/src/lib/modules/payments/subscriptions/after-payment-completed';

// import { AfterManuscriptPublishedEvent } from '../../../../libs/shared/src/lib/modules/manuscripts/subscriptions/AfterManuscriptPublishedEvent';

import { Context } from '../builders';

import { env } from '../env';

// This feature is a copy from https://github.com/kadirahq/graphql-errors

export const domainEventsRegisterLoader: MicroframeworkLoader = async (
  settings: MicroframeworkSettings | undefined
) => {
  if (settings) {
    const context: Context = settings.getData('context');
    const {
      repos: {
        paymentMethod,
        invoiceItem,
        manuscript,
        publisher,
        address,
        catalog,
        invoice,
        payment,
        coupon,
        waiver,
        payer
      },
      services: {
        erp,
        logger: loggerService,
        schedulingService,
        qq: queue,
        vatService,
      },
    } = context;

    const publishSageInvoiceToErpUsecase = env.app.erpRegisterInvoicesEnabled
      ? new PublishInvoiceToErpUsecase(
          invoice,
          invoiceItem,
          coupon,
          waiver,
          payer,
          address,
          manuscript,
          catalog,
          erp?.sage || null,
          publisher,
          loggerService,
          vatService
        )
      : new NoOpUseCase();
    const publishNetsuiteInvoiceToErpUsecase = env.app
      .erpRegisterInvoicesEnabled
      ? new PublishInvoiceToErpUsecase(
          invoice,
          invoiceItem,
          coupon,
          waiver,
          payer,
          address,
          manuscript,
          catalog,
          erp?.netsuite || null,
          publisher,
          loggerService,
          vatService
        )
      : new NoOpUseCase();

    const publishCreditNoteToErp = env.app.erpRegisterCreditNotesEnabled
      ? new PublishCreditNoteToErpUsecase(
          invoice,
          invoiceItem,
          coupon,
          waiver,
          erp?.netsuite || null,
          loggerService
        )
      : new NoOpUseCase();

    const publishPaymentToErp = env.app.erpRegisterPaymentsEnabled
      ? new PublishPaymentToErpUsecase(
          invoice,
          invoiceItem,
          payment,
          paymentMethod,
          coupon,
          waiver,
          payer,
          manuscript,
          catalog,
          erp?.netsuite || null,
          publisher,
          loggerService
        )
      : new NoOpUseCase();

    const publishInvoiceDraftCreated = new PublishInvoiceDraftCreatedUseCase(
      queue
    );
    const publishInvoiceDraftDeleted = new PublishInvoiceDraftDeletedUseCase(
      queue
    );
    const publishInvoiceDraftDueAmountUpdated = new PublishInvoiceDraftDueAmountUpdatedUseCase(
      queue
    );
    const publishInvoiceCreatedUsecase = new PublishInvoiceCreatedUsecase(
      queue
    );
    const publishInvoiceConfirmed = new PublishInvoiceConfirmedUsecase(queue);
    const publishInvoiceFinalized = new PublishInvoiceFinalizedUsecase(queue);
    const publishInvoiceCredited = new PublishInvoiceCreditedUsecase(queue);
    const publishInvoicePaid = new PublishInvoicePaidUsecase(queue);

    // Registering Invoice Events
    // tslint:disable-next-line: no-unused-expression
    new AfterInvoiceDraftCreatedEvent(
      invoice,
      invoiceItem,
      manuscript,
      coupon,
      waiver,
      publishInvoiceDraftCreated
    );

    new AfterInvoiceDraftDeletedEvent(
      invoice,
      invoiceItem,
      manuscript,
      coupon,
      waiver,
      publishInvoiceDraftDeleted
    );

    new AfterInvoiceDraftDueAmountUpdatedEvent(
      invoice,
      invoiceItem,
      manuscript,
      coupon,
      waiver,
      publishInvoiceDraftDueAmountUpdated
    );

    new AfterInvoiceCreatedEvent(
      invoice,
      invoiceItem,
      manuscript,
      publishInvoiceCreatedUsecase,
      schedulingService,
      env.scheduler.confirmationReminderDelay,
      env.scheduler.emailRemindersQueue
    );

    // tslint:disable-next-line: no-unused-expression
    new AfterInvoiceCreditNoteCreatedEvent(
      paymentMethod,
      invoiceItem,
      manuscript,
      address,
      invoice,
      payment,
      coupon,
      waiver,
      payer,
      publishInvoiceCredited,
      publishCreditNoteToErp,
      loggerService
    );

    // tslint:disable-next-line: no-unused-expression
    new AfterInvoiceConfirmed(
      invoiceItem,
      coupon,
      waiver,
      payer,
      address,
      manuscript,
      publishInvoiceConfirmed,
      publishSageInvoiceToErpUsecase,
      publishNetsuiteInvoiceToErpUsecase,
      schedulingService,
      loggerService,
      env.scheduler.creditControlReminderDelay,
      env.scheduler.paymentReminderDelay,
      env.scheduler.emailRemindersQueue
    );

    // tslint:disable-next-line: no-unused-expression
    new AfterInvoiceFinalized(
      paymentMethod,
      invoiceItem,
      manuscript,
      address,
      payment,
      coupon,
      waiver,
      payer,
      publishInvoiceFinalized,
      loggerService
    );

    // tslint:disable-next-line: no-unused-expression
    new AfterInvoicePaidEvent(
      paymentMethod,
      invoiceItem,
      manuscript,
      address,
      invoice,
      payment,
      coupon,
      waiver,
      payer,
      publishInvoicePaid,
      publishPaymentToErp,
      loggerService
    );

    // tslint:disable-next-line: no-unused-expression
    new AfterPaymentCompleted(invoice, loggerService, publishPaymentToErp);

    // new AfterManuscriptPublishedEvent(logger, manuscript);
  }
};
