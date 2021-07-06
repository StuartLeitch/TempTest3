/* eslint-disable @typescript-eslint/no-unused-vars */

// * Core Domain
import { UseCase } from '../../../../core/domain/UseCase';
import { UnexpectedError } from '../../../../core/logic/AppError';
import { left, right } from '../../../../core/logic/Either';
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';

// * Authorization Logic
import {
  AccessControlledUsecase,
  UsecaseAuthorizationContext,
  AccessControlContext,
  Authorize,
} from '../../../../domain/authorization';

import { InvoiceId } from '../../../invoices/domain/InvoiceId';
import { CreditNote } from '../../domain/CreditNote';
import { CreditNoteRepoContract } from '../../repos/creditNoteRepo';

// * Usecase specific
import { GetCreditNoteByInvoiceIdResponse as Response } from './getCreditNoteByInvoiceIdResponse';
import { GetCreditNoteByInvoiceIdErrors as Errors } from './getCreditNoteByInvoiceIdErrors';
import type { GetCreditNoteByInvoiceIdDTO as DTO } from './getCreditNoteByInvoiceIdDTO';

// to be modified with Guard/Either
export class GetCreditNoteByInvoiceIdUsecase
  implements
    UseCase<DTO, Promise<Response>, UsecaseAuthorizationContext>,
    AccessControlledUsecase<
      DTO,
      UsecaseAuthorizationContext,
      AccessControlContext
    > {
  constructor(
    // private articleRepo: ArticleRepoContract,
    private creditNoteRepo: CreditNoteRepoContract
  ) {}

  private async getAccessControlContext(request, context?) {
    return {};
  }

  @Authorize('read:credit_note')
  public async execute(
    request: DTO,
    context?: UsecaseAuthorizationContext
  ): Promise<Response> {
    const { invoiceId } = request;

    let creditNote: CreditNote;

    try {
      try {
        // * System identifies credit note by invoice id
        const maybeCreditNote = await this.creditNoteRepo.getCreditNoteByInvoiceId(
          InvoiceId.create(new UniqueEntityID(invoiceId))
        );
        if (maybeCreditNote.isLeft()) {
          return left(
            new UnexpectedError(new Error(maybeCreditNote.value.message))
          );
        }
        creditNote = maybeCreditNote.value;
      } catch (e) {
        return left(new Errors.CreditNoteNotFoundError(invoiceId));
      }

      return right(creditNote);
    } catch (err) {
      return left(new UnexpectedError(err, err.toString()));
    }
  }
}
