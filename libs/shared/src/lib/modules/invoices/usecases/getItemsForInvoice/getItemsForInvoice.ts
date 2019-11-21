// * Core Domain
import { Result, left, right } from '../../../../core/logic/Result';
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';
import { AppError } from '../../../../core/logic/AppError';
import { UseCase } from '../../../../core/domain/UseCase';

// * Authorization Logic
import { AccessControlContext } from '../../../../domain/authorization/AccessControl';
import { Roles } from '../../../users/domain/enums/Roles';
import {
  AccessControlledUsecase,
  AuthorizationContext,
  Authorize
} from '../../../../domain/authorization/decorators/Authorize';

// * Usecase specific
import { InvoiceRepoContract } from '../../repos/invoiceRepo';
import { InvoiceItemRepoContract } from '../../repos/invoiceItemRepo';

import { GetItemsForInvoiceResponse } from './getItemsForInvoiceResponse';
import { GetItemsForInvoiceErrors } from './getItemsForInvoiceErrors';
import { GetItemsForInvoiceDTO } from './getItemsForInvoiceDTO';
import { InvoiceItem } from '../../domain/InvoiceItem';
import { InvoiceId } from '../../domain/InvoiceId';

export type GetItemsForInvoiceContext = AuthorizationContext<Roles>;

export class GetItemsForInvoiceUsecase
  implements
    UseCase<
      GetItemsForInvoiceDTO,
      Promise<GetItemsForInvoiceResponse>,
      GetItemsForInvoiceContext
    >,
    AccessControlledUsecase<
      GetItemsForInvoiceDTO,
      GetItemsForInvoiceContext,
      AccessControlContext
    > {
  constructor(
    private invoiceItemRepo: InvoiceItemRepoContract,
    private invoiceRepo: InvoiceRepoContract
  ) {}

  // @Authorize('invoice:read')
  public async execute(
    request: GetItemsForInvoiceDTO,
    context?: GetItemsForInvoiceContext
  ): Promise<GetItemsForInvoiceResponse> {
    let items: InvoiceItem[];

    const invoiceId = InvoiceId.create(
      new UniqueEntityID(request.invoiceId)
    ).getValue();

    try {
      try {
        items = await this.invoiceItemRepo.getItemsByInvoiceId(invoiceId);
      } catch (err) {
        return left(
          new GetItemsForInvoiceErrors.InvoiceNotFoundError(
            invoiceId.id.toString()
          )
        );
      }

      if (items.length === 0) {
        return left(
          new GetItemsForInvoiceErrors.InvoiceHasNoItems(
            invoiceId.id.toString()
          )
        );
      } else {
        return right(Result.ok<InvoiceItem[]>(items));
      }
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}