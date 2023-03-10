import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { GuardFailure } from '../../../core/logic/GuardFailure';
import { Either, right } from '../../../core/logic/Either';
import { Entity } from '../../../core/domain/Entity';

export interface AuditLogProps {
  userAccount: string;
  entity: string;
  action: string;
  timestamp: Date;
  item_reference: string;
  target: string;
}

export class AuditLog extends Entity<AuditLogProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get userAccount(): string {
    return this.props.userAccount;
  }

  get entity(): string {
    return this.props.entity;
  }

  get action(): string {
    return this.props.action;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  get item_reference(): string {
    return this.props.item_reference;
  }

  get target(): string {
    return this.props.target;
  }

  private constructor(props: AuditLogProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: AuditLogProps,
    id?: UniqueEntityID
  ): Either<GuardFailure, AuditLog> {
    return right(
      new AuditLog(
        {
          ...props
        },
        id
      )
    );
  }
}
