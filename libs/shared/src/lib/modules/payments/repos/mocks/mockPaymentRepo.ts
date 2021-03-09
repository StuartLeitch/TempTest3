import { BaseMockRepo } from '../../../../core/tests/mocks/BaseMockRepo';
import { RepoError } from '../../../../infrastructure/RepoError';

import { PaymentRepoContract } from '../paymentRepo';

import { InvoiceId } from '../../../invoices/domain/InvoiceId';
import { ExternalOrderId } from '../../domain/external-order-id';
import { PaymentId } from '../../domain/PaymentId';
import { Payment } from '../../domain/Payment';

export class MockPaymentRepo
  extends BaseMockRepo<Payment>
  implements PaymentRepoContract {
  constructor() {
    super();
  }

  public async getPaymentById(paymentId: PaymentId): Promise<Payment> {
    const matches = this._items.filter((p) => p.paymentId.equals(paymentId));
    if (matches.length !== 0) {
      return matches[0];
    } else {
      return null;
    }
  }

  public async getPaymentCollection() {
    return this._items;
  }

  public async getPaymentByInvoiceId(invoiceId: InvoiceId): Promise<Payment> {
    const match = this._items.find((item) => item.invoiceId.equals(invoiceId));
    return match ? match : null;
  }

  public async getPaymentsByInvoiceId(
    invoiceId: InvoiceId
  ): Promise<Payment[]> {
    const match = this._items.filter((item) =>
      item.invoiceId.equals(invoiceId)
    );
    return match;
  }

  public async getUnregisteredErpPayments(): Promise<InvoiceId[]> {
    return null;
  }

  public async update(payment: Payment): Promise<Payment> {
    const alreadyExists = await this.exists(payment);

    if (alreadyExists) {
      this._items.map((p) => {
        if (this.compareMockItems(p, payment)) {
          return Payment;
        }
        return p;
      });
    }

    return payment;
  }

  async getPaymentByForeignId(
    foreignPaymentId: ExternalOrderId
  ): Promise<Payment> {
    const result = this._items.find((item) =>
      item.foreignPaymentId.equals(foreignPaymentId)
    );

    if (!result) {
      throw RepoError.createEntityNotFoundError(
        'payment by foreignPaymentId',
        foreignPaymentId.toString()
      );
    }

    return result;
  }

  public async updatePayment(payment: Payment): Promise<Payment> {
    const alreadyExists = await this.exists(payment);

    if (!alreadyExists) {
      throw RepoError.createEntityNotFoundError(
        'payment',
        payment.id.toString()
      );
    }

    const index = this._items.findIndex((p) => p.id.equals(payment.id));

    this._items[index] = payment;

    return payment;
  }

  public async save(payment: Payment): Promise<Payment> {
    const alreadyExists = await this.exists(payment);

    if (alreadyExists) {
      this._items.map((p) => {
        if (this.compareMockItems(p, payment)) {
          return payment;
        } else {
          return p;
        }
      });
    } else {
      this._items.push(payment);
    }

    return payment;
  }

  public async delete(payment: Payment): Promise<boolean> {
    return true;
  }

  public async exists(payment: Payment): Promise<boolean> {
    const found = this._items.filter((p) => this.compareMockItems(p, payment));
    return found.length !== 0;
  }

  public compareMockItems(a: Payment, b: Payment): boolean {
    return a.id.equals(b.id);
  }
}
