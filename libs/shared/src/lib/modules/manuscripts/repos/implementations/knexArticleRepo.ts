import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';

import { Knex, TABLES } from '../../../../infrastructure/database/knex';
import { AbstractBaseDBRepo } from '../../../../infrastructure/AbstractBaseDBRepo';
import { RepoError } from '../../../../infrastructure/RepoError';

import { ManuscriptId } from '../../../invoices/domain/ManuscriptId';
import { Article } from '../../domain/Article';
import { ArticleId } from '../../domain/ArticleId';
import { Manuscript } from '../../domain/Manuscript';
import { ArticleMap } from '../../mappers/ArticleMap';
import { ManuscriptMap } from '../../mappers/ManuscriptMap';

import { ArticleRepoContract } from '../articleRepo';

export class KnexArticleRepo extends AbstractBaseDBRepo<Knex, Article>
  implements ArticleRepoContract {
  async findById(manuscriptId: ManuscriptId | string): Promise<Article> {
    if (typeof manuscriptId === 'string') {
      manuscriptId = ManuscriptId.create(
        new UniqueEntityID(manuscriptId)
      ).getValue();
    }
    const articleData = await this.db(TABLES.ARTICLES)
      .select()
      .where('id', manuscriptId.id.toString())
      .first();

    return articleData ? ArticleMap.toDomain(articleData) : null;
  }

  async findByCustomId(customId: string): Promise<Article> {
    const articleData = await this.db(TABLES.ARTICLES)
      .select()
      .where('customId', customId)
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
    const { db } = this;

    await db(TABLES.ARTICLES).insert(ArticleMap.toPersistence(article));

    return article;
  }

  async update(manuscript: Manuscript): Promise<Manuscript> {
    const { db } = this;

    const updated = await db(TABLES.ARTICLES)
      .where({ id: manuscript.id.toString() })
      .update(ManuscriptMap.toPersistence(manuscript));

    if (!updated) {
      throw RepoError.createEntityNotFoundError(
        'manuscript',
        manuscript.id.toString()
      );
    }

    return manuscript;
  }

  async delete(manuscript: Manuscript): Promise<unknown> {
    const { db } = this;

    const deletedRows = await db(TABLES.ARTICLES)
      .where('id', manuscript.id.toString())
      .update({ ...ManuscriptMap.toPersistence(manuscript), deleted: 1 });

    return deletedRows
      ? deletedRows
      : Promise.reject(
          RepoError.createEntityNotFoundError(
            'manuscript',
            manuscript.id.toString()
          )
        );
  }
}
