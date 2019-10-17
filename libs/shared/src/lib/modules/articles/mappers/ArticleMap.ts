import {UniqueEntityID} from '../../../core/domain/UniqueEntityID';
import {Mapper} from '../../../infrastructure/Mapper';
import {Article} from '../domain/Article';
// import {PriceId} from '../domain/PriceId';
export class ArticleMap extends Mapper<Article> {
  public static toDomain(raw: any): Article {
    const articleOrError = Article.create(
      {
        // journalId: JournalId.create(new UniqueEntityID(raw.journalId)).getValue(),
        title: raw.title,
        articleTypeId: raw.articleTypeId,
        authorEmail: raw.authorEmail,
        authorCountry: raw.authorCountry,
        authorSurname: raw.authorSurname
      },
      new UniqueEntityID(raw.id)
    );

    articleOrError.isFailure ? console.log(articleOrError) : '';

    return articleOrError.isSuccess ? articleOrError.getValue() : null;
  }

  public static toPersistence(article: Article): any {
    return {
      id: article.id.toString(),
      journalId: article.props.journalId.toString(),
      title: article.props.title,
      articleTypeId: article.props.articleTypeId,
      authorEmail: article.props.authorEmail,
      authorCountry: article.props.authorCountry,
      authorSurname: article.props.authorSurname
    };
  }
}
