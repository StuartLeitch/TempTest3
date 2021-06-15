// * Core Domain
import { UnexpectedError } from '../../../../core/logic/AppError';
import { left, right } from '../../../../core/logic/Either';
import { UseCase } from '../../../../core/domain/UseCase';

// * Authorization Logic
import type { UsecaseAuthorizationContext as Context } from '../../../../domain/authorization';

// * Usecase specific
import { InvoiceItemRepoContract } from '../../repos/invoiceItemRepo';

import { UpdateInvoiceItemsResponse as Response } from './updateInvoiceItemsResponse';
import { UpdateInvoiceItemsDTO as DTO } from './updateInvoiceItemsDTO';
import * as Errors from './updateInvoiceItemsErrors';

export class UpdateInvoiceItemsUsecase
  implements UseCase<DTO, Promise<Response>, Context> {
  constructor(private invoiceItemRepo: InvoiceItemRepoContract) {}

  public async execute(request: DTO, context?: Context): Promise<Response> {
    try {
      request.invoiceItems.forEach(async (item) => {
        const maybeAlreadyExists = await this.invoiceItemRepo.exists(item);

        if (maybeAlreadyExists.isLeft()) {
          throw new Error(maybeAlreadyExists.value.message);
        }

        const alreadyExists = maybeAlreadyExists.value;
        if (!alreadyExists) {
          throw new Errors.InvoiceItemNotFound(item.id.toString());
        } else {
          this.invoiceItemRepo.update(item);
        }
      });
    } catch (err) {
      if (err instanceof Errors.InvoiceItemNotFound) {
        return left(err);
      } else {
        return left(new UnexpectedError(err));
      }
    }
    return right(null);
  }
}
