import { ValueObject } from '../../../core/domain/ValueObject';

import { InvoiceItemId } from '../../invoices/domain/InvoiceItemId';
import { Coupon } from './Coupon';

export interface CouponAssignedProps {
  invoiceItemId: InvoiceItemId;
  dateAssigned: Date;
  coupon: Coupon;
}

export class CouponAssigned extends ValueObject<CouponAssignedProps> {
  get invoiceItemId(): InvoiceItemId {
    return this.props.invoiceItemId;
  }

  get dateAssigned(): Date {
    return this.props.dateAssigned;
  }

  get coupon(): Coupon {
    return this.props.coupon;
  }

  private constructor(props: CouponAssignedProps) {
    super(props);
  }

  static create(props: CouponAssignedProps): CouponAssigned {
    const defaultValues = {
      ...props,
      appliedDate: props.dateAssigned ?? new Date(),
    };
    return new CouponAssigned(defaultValues);
  }

  equals(wa: CouponAssigned): boolean {
    const itemEq = this.invoiceItemId.equals(wa.invoiceItemId);
    const waiverEq = this.coupon.id.equals(wa.coupon.id);

    return itemEq && waiverEq;
  }
}
