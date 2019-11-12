import Knex from 'knex';
import {
  KnexAddressRepo,
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

export interface ReposContext {
  address: KnexAddressRepo;
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
}

export function makeContext(config: Config, db: Knex): Context {
  return {
    repos: {
      address: new KnexAddressRepo(db),
      invoice: new KnexInvoiceRepo(db),
      transaction: new KnexTransactionRepo(db),
      payment: new KnexPaymentRepo(db),
      waiver: new KnexWaiverRepo(db),
      payer: new KnexPayerRepo(db)
    },
    checkoutService: new CheckoutService(),
    authService: new AuthService(config),
    vatService: new VATService(),
    waiverService: new WaiverService()
  };
}
