// * Core domain
import {AggregateRoot} from '../../../core/domain/AggregateRoot';
import {UniqueEntityID} from '../../../core/domain/UniqueEntityID';
import {Result} from '../../../core/logic/Result';

interface ArticleProps {
  journalId?: string;
  title?: string;
  articleTypeId?: string;
  created?: Date;
  authorEmail?: string;
  authorCountry?: string;
  authorSurname?: string;
}

export class Article extends AggregateRoot<ArticleProps> {
  private constructor(props: ArticleProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get id(): UniqueEntityID {
    return this._id;
  }

  get title(): string {
    return this.props.title;
  }

  get articleTypeId(): string {
    return this.props.articleTypeId;
  }

  public static create(
    props: ArticleProps,
    id?: UniqueEntityID
  ): Result<Article> {
    const article = new Article(
      {
        ...props,
        created: props.created ? props.created : new Date()
      },
      id
    );

    return Result.ok<Article>(article);
  }
}
