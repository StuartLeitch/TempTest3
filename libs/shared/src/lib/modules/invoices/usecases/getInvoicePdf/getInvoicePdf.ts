// * Core Domain
import { Result, Either, left, right } from '../../../../core/logic/Result';
import { AppError } from '../../../../core/logic/AppError';
import { UseCase } from '../../../../core/domain/UseCase';
import { chain } from '../../../../core/logic/EitherChain';
import { map } from '../../../../core/logic/EitherMap';

// * Authorization Logic
import { AccessControlContext } from '../../../../domain/authorization/AccessControl';
import { Roles } from '../../../users/domain/enums/Roles';
import {
  AccessControlledUsecase,
  AuthorizationContext,
  Authorize
} from '../../../../domain/authorization/decorators/Authorize';

// * Usecase specific
import streamToPromise from 'stream-to-promise';

import { InvoiceItemRepoContract } from '../../repos/invoiceItemRepo';
import { PayerRepoContract } from '../../../payers/repos/payerRepo';
import { InvoiceRepoContract } from '../../repos/invoiceRepo';

import { Author } from '../../../authors/domain/Author';
import { Invoice } from '../../domain/Invoice';

import { GetInvoicePdfResponse } from './getInvoicePdfResponse';
import { GetInvoicePdfDTO } from './getInvoicePdfDTO';

import { GetInvoiceDetailsUsecase } from '../getInvoiceDetails/getInvoiceDetails';
import { GetArticleDetailsUsecase } from '../../../articles/usecases/getArticleDetails/getArticleDetails';
import { GetPayerDetailsUsecase } from '../../../payers/usecases/getPayerDetails/getPayerDetails';
import { AuthorMap } from '../../../authors/mappers/AuthorMap';

import { GetAuthorDetailsErrors } from '../../../authors/usecases/getAuthorDetails/getAuthorDetailsErrors';

import { InvoicePayload } from '../../../../domain/services/PdfGenerator/PdfGenerator';
import { pdfGeneratorService } from '../../../../domain/services';
import { GetItemsForInvoiceUsecase } from '../getItemsForInvoice/getItemsForInvoice';

export type GetInvoicePdfContext = AuthorizationContext<Roles>;

export class GetInvoicePdfUsecase
  implements
    UseCase<
      GetInvoicePdfDTO,
      Promise<GetInvoicePdfResponse>,
      GetInvoicePdfContext
    >,
    AccessControlledUsecase<
      GetInvoicePdfDTO,
      GetInvoicePdfContext,
      AccessControlContext
    > {
  authorizationContext: AuthorizationContext<Roles>;

  constructor(
    private invoiceItemRepo: InvoiceItemRepoContract,
    private invoiceRepo: InvoiceRepoContract,
    private payerRepo: PayerRepoContract
  ) {}

  public async execute(
    request: GetInvoicePdfDTO,
    context?: GetInvoicePdfContext
  ): Promise<GetInvoicePdfResponse> {
    this.authorizationContext = context;
    const { payerId } = request;
    const emptyPayload: InvoicePayload = {
      article: null,
      invoice: null,
      author: null,
      payer: null
    };

    const payload = await chain(
      [
        this.getPayloadWithPayer(payerId).bind(this),
        this.getPayloadWithInvoice.bind(this),
        this.getPayloadWithArticle.bind(this),
        this.getPayloadWithAuthor.bind(this)
      ],
      emptyPayload
    );

    const pdfEither: any = await map(
      [
        pdfGeneratorService.getInvoice.bind(pdfGeneratorService),
        streamToPromise
      ],
      payload
    );
    return pdfEither.map(pdf => Result.ok(pdf)) as GetInvoicePdfResponse;
  }

  private getPayloadWithPayer(payerId: string) {
    return async (payload: InvoicePayload) => {
      const usecase = new GetPayerDetailsUsecase(this.payerRepo);
      const payerEither = await usecase.execute(
        { payerId },
        this.authorizationContext
      );
      return payerEither.map(payerResult => ({
        ...payload,
        payer: payerResult.getValue()
      }));
    };
  }

  private async getInvoiceItems(invoiceId: string) {
    const usecase = new GetItemsForInvoiceUsecase(
      this.invoiceItemRepo,
      this.invoiceRepo
    );
    const itemsEither = await usecase.execute({ invoiceId });
    return itemsEither;
  }

  private async addItemsForInvoice(
    invoiceId: string,
    invoiceResult: Result<Invoice>
  ) {
    const invoice = invoiceResult.getValue();
    const itemsEither = await this.getInvoiceItems(invoiceId);
    const invoiceEither = itemsEither
      .map(itemsResult =>
        itemsResult.getValue().map(item => invoice.addInvoiceItem(item))
      )
      .map(() => Result.ok(invoice));
    return invoiceEither;
  }

  private async getPayloadWithInvoice(payload: InvoicePayload) {
    const invoiceId = payload.payer.invoiceId.id.toString();
    const usecase = new GetInvoiceDetailsUsecase(this.invoiceRepo);
    const invoiceEither = await usecase.execute(
      { invoiceId },
      this.authorizationContext
    );
    const invoiceWithItems = await chain(
      [this.addItemsForInvoice.bind(this, invoiceId)],
      invoiceEither
    );

    return invoiceWithItems.map(invoiceResult => ({
      ...payload,
      invoice: invoiceResult.getValue()
    }));
  }

  private getArticleId(invoice: Invoice): Either<string, string> {
    const apcItems = invoice.invoiceItems.currentItems.filter(
      item => item.type === 'APC'
    );
    if (apcItems.length > 0) {
      return right(apcItems[0].manuscriptId.id.toString());
    } else {
      return left(null);
    }
  }

  private async getPayloadWithArticle(payload: InvoicePayload) {
    const articleIdEither = this.getArticleId(payload.invoice);
    if (articleIdEither.isLeft()) {
      return left<AppError.UnexpectedError, InvoicePayload>(
        Result.fail({
          message: `no APC found for the invoice with id ${payload.invoice.id.toString()}`
        })
      );
    } else {
      const usecase = new GetArticleDetailsUsecase();
      const articleEither = await usecase.execute(
        { articleId: articleIdEither.value },
        this.authorizationContext
      );
      return articleEither.map(articleResult => ({
        ...payload,
        article: articleResult.getValue()
      }));
    }
  }

  private async getPayloadWithAuthor(
    payload: InvoicePayload
  ): Promise<
    Either<GetAuthorDetailsErrors.AuthorNotFoundError, InvoicePayload>
  > {
    const { article } = payload;

    if (!article) {
      return right(payload);
    } else {
      try {
        const authorName = payload.article.authorSurname;
        const author = AuthorMap.toDomain({ name: authorName, id: '' });
        return right({ ...payload, author });
      } catch (e) {
        return left(Result.fail(e.message));
      }
    }
  }
}
