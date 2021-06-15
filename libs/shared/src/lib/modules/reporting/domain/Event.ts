// * Core Domain
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { AggregateRoot } from '../../../core/domain/AggregateRoot';
import { GuardFailure } from '../../../core/logic/GuardFailure';
import { Either, right } from '../../../core/logic/Either';

export interface EventProps {
  type: string;
  time: Date;
  payload: string;
}

export class Event extends AggregateRoot<EventProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get time(): Date {
    return this.props.time;
  }

  get type(): string {
    return this.props.type;
  }

  get payload(): string {
    return this.props.payload;
  }

  private constructor(props: EventProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: EventProps,
    id?: UniqueEntityID
  ): Either<GuardFailure, Event> {
    const event = new Event(props, id);
    return right(event);
  }
}
