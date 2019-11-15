import Knex from 'knex';
import {
  KnexAddressRepo,
  KnexInvoiceItemRepo,
  KnexInvoiceRepo,
  KnexTransactionRepo,
  KnexPaymentRepo,
  KnexPayerRepo,
  KnexWaiverRepo,
  KnexCatalogRepo,
  VATService,
  WaiverService
} from '@hindawi/shared';
import { Config } from './config';
import { CheckoutService } from './services/checkout';
import { AuthService } from './services/auth';

export interface ReposContext {
  address: KnexAddressRepo;
  invoice: KnexInvoiceRepo;
  invoiceItem: KnexInvoiceItemRepo;
  transaction: KnexTransactionRepo;
  payment: KnexPaymentRepo;
  waiver: KnexWaiverRepo;
  payer: KnexPayerRepo;
  catalog: KnexCatalogRepo;
}

export interface Context {
  repos: ReposContext;
  checkoutService: CheckoutService;
  authService: AuthService;
  vatService: VATService;
  waiverService: WaiverService;
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
    repos: {
      address: new KnexAddressRepo(db),
      invoice: new KnexInvoiceRepo(db),
      invoiceItem: new KnexInvoiceItemRepo(db),
      transaction: new KnexTransactionRepo(db),
      payment: new KnexPaymentRepo(db),
      waiver: new KnexWaiverRepo(db),
      payer: new KnexPayerRepo(db),
      catalog: new KnexCatalogRepo(db)
    },
    checkoutService: new CheckoutService(),
    authService: new AuthService(config),
    vatService: new VATService(),
    waiverService: new WaiverService()
  };
}
