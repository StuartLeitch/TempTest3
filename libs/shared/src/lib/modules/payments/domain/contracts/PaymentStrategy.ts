import {PaymentModel} from './PaymentModel';

export interface PaymentStrategyContract {
  makePayment(pm: PaymentModel): void;
}
