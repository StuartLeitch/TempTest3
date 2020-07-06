import Knex from 'knex';

import {
  KnexSentNotificationsRepo,
  KnexPausedReminderRepo,
  KnexPaymentMethodRepo,
  KnexInvoiceItemRepo,
  KnexTransactionRepo,
  KnexPublisherRepo,
  KnexAddressRepo,
  KnexArticleRepo,
  KnexCatalogRepo,
  KnexInvoiceRepo,
  KnexPaymentRepo,
  KnexCouponRepo,
  KnexEditorRepo,
  KnexWaiverRepo,
  KnexPayerRepo,
  LoggerBuilder,
} from '@hindawi/shared';

export interface Repos {
  address: KnexAddressRepo;
  catalog: KnexCatalogRepo;
  invoice: KnexInvoiceRepo;
  invoiceItem: KnexInvoiceItemRepo;
  transaction: KnexTransactionRepo;
  payer: KnexPayerRepo;
  payment: KnexPaymentRepo;
  paymentMethod: KnexPaymentMethodRepo;
  waiver: KnexWaiverRepo;
  manuscript: KnexArticleRepo;
  editor: KnexEditorRepo;
  coupon: KnexCouponRepo;
  publisher: KnexPublisherRepo;
  sentNotifications: KnexSentNotificationsRepo;
  pausedReminder: KnexPausedReminderRepo;
}

export function buildRepos(db: Knex, loggerBuilder: LoggerBuilder): Repos {
  return {
    address: new KnexAddressRepo(db),
    catalog: new KnexCatalogRepo(db),
    invoice: new KnexInvoiceRepo(db, loggerBuilder.getLogger()),
    invoiceItem: new KnexInvoiceItemRepo(db, loggerBuilder.getLogger()),
    transaction: new KnexTransactionRepo(db, loggerBuilder.getLogger()),
    payer: new KnexPayerRepo(db),
    payment: new KnexPaymentRepo(db),
    paymentMethod: new KnexPaymentMethodRepo(db, loggerBuilder.getLogger()),
    waiver: new KnexWaiverRepo(db),
    manuscript: new KnexArticleRepo(db, loggerBuilder.getLogger()),
    editor: new KnexEditorRepo(db),
    coupon: new KnexCouponRepo(db),
    publisher: new KnexPublisherRepo(db),
    sentNotifications: new KnexSentNotificationsRepo(db),
    pausedReminder: new KnexPausedReminderRepo(db),
  };
}
