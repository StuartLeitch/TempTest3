import { Repo } from '../../../infrastructure/Repo';

import { InvoiceId } from '../../invoices/domain/InvoiceId';
import { ManuscriptId } from '../../invoices/domain/ManuscriptId';
import { Article } from '../domain/Article';
import { ArticleId } from '../domain/ArticleId';
import { Manuscript } from '../domain/Manuscript';

export interface ArticleRepoContract extends Repo<Article | Manuscript> {
  findById(manuscriptId: ManuscriptId): Promise<Article | Manuscript>;
  findByCustomId(
    customId: ManuscriptId | string
  ): Promise<Article | Manuscript>;
  getAuthorOfArticle(articleId: ArticleId): Promise<unknown>;
  delete(manuscript: Manuscript): Promise<void>;
  restore(manuscript: Manuscript): Promise<void>;
  update(manuscript: Manuscript): Promise<Manuscript>;
  filterBy(criteria: any): any;
  findByInvoiceId?(invoiceId: InvoiceId): Promise<Manuscript>;
}
