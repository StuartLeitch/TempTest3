// * Core domain
import { AggregateRoot } from '../../../core/domain/AggregateRoot';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { Result } from '../../../core/logic/Result';
import { ManuscriptId } from '../../invoices/domain/ManuscriptId';

interface ManuscriptProps {
  journalId?: string;
  title?: string;
  articleTypeId?: string;
  created?: Date;
  authorEmail?: string;
  authorCountry?: string;
  authorSurname?: string;
}

export class Manuscript extends AggregateRoot<ManuscriptProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get manuscriptId(): ManuscriptId {
    return ManuscriptId.create(this._id).getValue();
  }

  get authorEmail(): string {
    return this.props.authorEmail;
  }

  get authorCountry(): string {
    return this.props.authorCountry;
  }

  get title(): string {
    return this.props.title;
  }

  get articleTypeId(): string {
    return this.props.articleTypeId;
  }

  private constructor(props: ManuscriptProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: ManuscriptProps,
    id?: UniqueEntityID
  ): Result<Manuscript> {
    const manuscript = new Manuscript(
      {
        ...props,
        created: props.created ? props.created : new Date()
      },
      id
    );

    return Result.ok<Manuscript>(manuscript);
  }
}
