// * Core Domain
// import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { ValueObject } from '../../../core/domain/ValueObject';
import { Either, right, left } from '../../../core/logic/Result';
// import { Result } from '../../../core/logic/Result';

import { Guard } from '../../../core/logic/Guard';
// import { UserName } from '../../users/domain/userName';
// // * Subdomain
// import { AddressId } from './AddressId';

export interface ErpReferenceProps {
  entity_id: string;
  vendor: string;
  entity_type: string;
  attribute?: string;
  value?: string;
}
/**
 * @desc Read model for ErpReference
 */
export class ErpReference extends ValueObject<ErpReferenceProps> {
  get vendor(): string {
    return this.props.vendor;
  }

  get entityType(): string {
    return this.props.entity_type;
  }

  // get isDeleted(): boolean {
  //   return this.props.isDeleted;
  // }

  private constructor(props: ErpReferenceProps) {
    super(props);
  }

  public static create(props: ErpReferenceProps): Either<any, ErpReference> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.vendor, argumentName: 'vendor' },
      { argument: props.entity_type, argumentName: 'entity_type' },
    ]);

    if (!guardResult.succeeded) {
      return left(guardResult.message);
    }

    const newErpReference = new ErpReference({
      ...props,
      vendor: props.vendor ?? null,
      entity_type: props.entity_type ?? null,
    });

    return right(newErpReference);
  }
}
