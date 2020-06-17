/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  MicroframeworkLoader,
  MicroframeworkSettings,
} from 'microframework-w3tec';

// import { CorrelationID } from '../../../../libs/shared/src/lib/core/domain/CorrelationID';

import {
  KnexPaymentMethodRepo,
  KnexAddressRepo,
  KnexArticleRepo,
  KnexInvoiceItemRepo,
  KnexInvoiceRepo,
  KnexTransactionRepo,
  KnexPaymentRepo,
  KnexPayerRepo,
  KnexWaiverRepo,
  KnexCatalogRepo,
  VATService,
  WaiverService,
  EmailService,
  KnexEditorRepo,
  KnexCouponRepo,
  KnexPublisherRepo,
  KnexSentNotificationsRepo,
  KnexPausedReminderRepo,
} from '@hindawi/shared';

import { ExchangeRateService } from '../../../../libs/shared/src/lib/domain/services/ExchangeRateService';
import { LoggerBuilder } from './../../../../libs/shared/src/lib/infrastructure/logging/LoggerBuilder';
import { CheckoutService } from '../services/checkout';
// import { AuthService } from '../services/auth';
import { PayPalService } from '../services/paypal';

import { env } from '../env';
import { BullScheduler } from '@hindawi/sisif';

export const contextLoader: MicroframeworkLoader = (
  settings: MicroframeworkSettings | undefined
) => {
  if (settings) {
    const db = settings.getData('connection');
    const loggerBuilder = new LoggerBuilder();

    const repos = {
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

    const bullData = {
      password: env.scheduler.db.password,
      host: env.scheduler.db.host,
      port: env.scheduler.db.port,
    };

    const services = {
      logger: loggerBuilder.getLogger(),
      checkoutService: new CheckoutService(),
      // authService: new AuthService({}),
      vatService: new VATService(),
      waiverService: new WaiverService(repos.waiver, repos.editor),
      emailService: new EmailService(
        env.app.mailingDisabled,
        env.app.FERoot,
        env.app.tenantName
      ),
      exchangeRateService: new ExchangeRateService(),
      payPalService: new PayPalService(env.paypal),
      schedulingService: new BullScheduler(bullData, loggerBuilder.getLogger()),
    };

    const context = {
      repos,
      services,
    };

    settings.setData('context', context);
  }
};
