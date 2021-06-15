// * Core Domain
import { UnexpectedError } from '../../../../core/logic/AppError';
import { left, right } from '../../../../core/logic/Either';
import { UseCase } from '../../../../core/domain/UseCase';

import { RepoError } from '../../../../infrastructure/RepoError';

// * Authorization Logic
import type { UsecaseAuthorizationContext as Context } from '../../../../domain/authorization';
import {
  AccessControlledUsecase,
  AccessControlContext,
  Authorize,
} from '../../../../domain/authorization';

import { CouponCode } from '../../domain/CouponCode';

import { CouponRepoContract } from '../../repos/couponRepo';

// * Usecase specific
import { GetCouponDetailsByCodeResponse as Response } from './getCouponDetailsByCodeResponse';
import type { GetCouponDetailsByCodeDTO as DTO } from './getCouponDetailsByCodeDTO';
import { CouponNotFoundError } from './getCouponDetailsByCodeErrors';

export class GetCouponDetailsByCodeUsecase
  implements
    UseCase<DTO, Promise<Response>, Context>,
    AccessControlledUsecase<DTO, Context, AccessControlContext> {
  constructor(private couponRepo: CouponRepoContract) {}

  private async getAccessControlContext(request, context?) {
    return {};
  }

  @Authorize('invoice:read')
  public async execute(request: DTO, context?: Context): Promise<Response> {
    const maybeCouponCode = CouponCode.create(request.couponCode);

    if (maybeCouponCode.isLeft()) {
      return left(maybeCouponCode.value);
    }

    const couponCode = maybeCouponCode.value;

    try {
      try {
        const coupon = await this.couponRepo.getCouponByCode(couponCode);
        if (coupon.isLeft()) {
          if (coupon.value instanceof RepoError) {
            return left(new CouponNotFoundError(couponCode.toString()));
          } else {
            return left(new UnexpectedError(new Error(coupon.value.message)));
          }
        }
        return right(coupon.value);
      } catch (err) {
        return left(new CouponNotFoundError(couponCode.toString()));
      }
    } catch (err) {
      return left(new UnexpectedError(err));
    }
  }
}
