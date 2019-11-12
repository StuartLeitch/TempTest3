import Knex from 'knex';
import {
  KnexInvoiceRepo,
  KnexTransactionRepo,
  KnexPaymentRepo,
  KnexPayerRepo,
  KnexWaiverRepo,
  VATService,
  WaiverService
} from '@hindawi/shared';
import {Config} from './config';
import {CheckoutService} from './services/checkout';
import {AuthService} from './services/auth';
import {InvoicePdfService} from './services/InvoicePdf';

export interface ReposContext {
  invoice: KnexInvoiceRepo;
  transaction: KnexTransactionRepo;
  payment: KnexPaymentRepo;
  waiver: KnexWaiverRepo;
  payer: KnexPayerRepo;
}

export interface Context {
  repos: ReposContext;
  checkoutService: CheckoutService;
  authService: AuthService;
  vatService: VATService;
  waiverService: WaiverService;
  invoicePdfService: InvoicePdfService;
}

export function makeContext(config: Config, db: Knex): Context {
  const repos = {
    invoice: new KnexInvoiceRepo(db),
    transaction: new KnexTransactionRepo(db),
    payment: new KnexPaymentRepo(db),
    waiver: new KnexWaiverRepo(db),
    payer: new KnexPayerRepo(db)
  };

  return {
    repos,
    invoicePdfService: new InvoicePdfService(repos.invoice, repos.payer),
    checkoutService: new CheckoutService(),
    authService: new AuthService(config),
    vatService: new VATService(),
    waiverService: new WaiverService()
  };
}
