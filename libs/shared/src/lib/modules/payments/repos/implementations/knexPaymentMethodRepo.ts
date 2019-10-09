import {
  PaymentMethod,
  PaymentMethodId,
  PaymentMethodRepoContract,
  PaymentMethodMap,
  Knex
} from '../../../../..';
import {AbstractBaseDBRepo} from '../../../../infrastructure/AbstractBaseDBRepo';
import {RepoErrorCode, RepoError} from '../../../../infrastructure/RepoError';

export class KnexPaymentMethodRepo
  extends AbstractBaseDBRepo<Knex, PaymentMethod>
  implements PaymentMethodRepoContract {
  async getPaymentMethodById(
    paymentMethodId: PaymentMethodId
  ): Promise<PaymentMethod> {
    const {db} = this;

    const paymentMethodRow = await db('payment_methods')
      .select()
      .where('id', paymentMethodId.id.toString())
      .first();

    if (!paymentMethodRow) {
      throw RepoError.createEntityNotFoundError(
        'payment-method',
        paymentMethodId.id.toString()
      );
    }

    return PaymentMethodMap.toDomain(paymentMethodRow);
  }

  async save(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
    const {db} = this;

    try {
      await db('payment_methods').insert(
        PaymentMethodMap.toPersistence(paymentMethod)
      );
    } catch (e) {
      throw RepoError.fromDBError(e);
    }

    return this.getPaymentMethodById(paymentMethod.paymentMethodId);
  }

  async getPaymentMethodCollection(): Promise<PaymentMethod[]> {
    return [];
  }

  async exists(paymentMethod: PaymentMethod): Promise<boolean> {
    try {
      await this.getPaymentMethodById(paymentMethod.paymentMethodId);
    } catch (e) {
      if (e.code === RepoErrorCode.ENTITY_NOT_FOUND) {
        return false;
      }

      throw e;
    }

    return true;
  }
}
