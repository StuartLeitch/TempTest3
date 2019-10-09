import {Result} from '../../../core/logic/Result';
import {UniqueEntityID} from '../../../core/domain/UniqueEntityID';

import {BaseReductionCreator} from './BaseReductionCreator';
import {ReductionProps} from './Reduction';
import {Coupon} from './Coupon';

/**
 * Concrete Creators override the factory method in order to change the
 * resulting reduction's type.
 */
export class CouponCreator extends BaseReductionCreator {
  /**
   * Note that the signature of the method still uses the abstract reduction
   * type, even though the concrete reduction is actually returned from the
   * method. This way the Creator can stay independent of concrete reduction
   * classes.
   */
  public create(props: ReductionProps, id?: UniqueEntityID): Result<Coupon> {
    return Coupon.create(
      {
        ...props
      },
      id
    );
  }
}
