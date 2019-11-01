import {UniqueEntityID, Article, ArticleId, ArticleMap} from '../../../../shared';
import {Knex} from '../../../../infrastructure/database/knex';
import {AbstractBaseDBRepo} from '../../../../infrastructure/AbstractBaseDBRepo';
import {ManuscriptId} from '../../../invoices/domain/ManuscriptId';
import {ArticleRepoContract} from '../articleRepo';

export class KnexArticleRepo extends AbstractBaseDBRepo<Knex, Article>
  implements ArticleRepoContract {
  async findById(manuscriptId: ManuscriptId | string): Promise<Article> {
    if (typeof manuscriptId === 'string') {
      manuscriptId = ManuscriptId.create(
        new UniqueEntityID(manuscriptId)
      ).getValue();
    }
    const articleData = await this.db('articles')
      .select()
      .where('id', manuscriptId.id.toString())
      .first();

    return articleData ? ArticleMap.toDomain(articleData) : null;
  }

  getAuthorOfArticle(articleId: ArticleId): Promise<unknown> {
    return Promise.resolve(articleId);
  }

  exists(article: Article): Promise<boolean> {
    return Promise.resolve(true);
  }

  async save(article: Article): Promise<Article> {
    const {db} = this;

    await db('articles').insert(ArticleMap.toPersistence(article));

    return article;
  }
}
