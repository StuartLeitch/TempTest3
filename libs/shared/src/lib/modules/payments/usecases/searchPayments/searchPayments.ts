// * Core Domain
import {UseCase} from '../../../../core/domain/UseCase';
import {Result} from '../../../../core/logic/Result';

import {Payment} from '../../domain/Payment';
import {PaymentRepoContract} from '../../repos/paymentRepo';

import {
  Authorize,
  AccessControlledUsecase,
  AuthorizationContext
} from '../../../../domain/authorization/decorators/Authorize';
import {AccessControlContext} from '../../../../domain/authorization/AccessControl';
import {Roles} from '../../../users/domain/enums/Roles';

export interface SearchPaymentsRequestDTO {
  params: string[];
}

export type SearchPaymentsContext = AuthorizationContext<Roles>;
export class SearchPayments
  implements
    UseCase<SearchPaymentsRequestDTO, Result<Payment[]>, SearchPaymentsContext>,
    AccessControlledUsecase<
      SearchPaymentsRequestDTO,
      SearchPaymentsContext,
      AccessControlContext
    > {
  private paymentRepo: PaymentRepoContract;

  constructor(paymentRepo: PaymentRepoContract) {
    this.paymentRepo = paymentRepo;
  }

  private async searchPayments(params: string[]): Promise<Result<Payment[]>> {
    // const payments = await this.paymentRepo.getPaymentCollection(params);
    // TODO mock this until we know what params are
    const payments = [];

    if (!payments) {
      return Result.fail<Payment[]>(
        `Couldn't find payment(s) matching ${params}`
      );
    }

    return Result.ok<Payment[]>(payments);
  }

  public async getAccessControlContext(request, context?) {
    return {};
  }

  @Authorize('payment:search')
  public async execute(
    request: SearchPaymentsRequestDTO
  ): Promise<Result<Payment[]>> {
    const {params} = request;

    try {
      // * System searches for payments matching query params
      const paymentsOrError = await this.searchPayments(params);
      if (paymentsOrError.isFailure) {
        return Result.fail<Payment[]>(paymentsOrError.error);
      }
      const payments = paymentsOrError.getValue();

      // magic happens here
      return Result.ok<Payment[]>(payments);
    } catch (err) {
      return Result.fail<Payment[]>(err);
    }
  }
}
