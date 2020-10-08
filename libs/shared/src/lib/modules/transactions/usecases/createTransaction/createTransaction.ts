/* eslint-disable @typescript-eslint/no-unused-vars */

// * Core Domain
import { UseCase } from '../../../../core/domain/UseCase';
import { Result, left, right } from '../../../../core/logic/Result';
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';
import { DomainEvents } from '../../../../core/domain/events/DomainEvents';

import { UnexpectedError } from '../../../../core/logic/AppError';
import { CreateTransactionResponse } from './createTransactionResponse';
import { CreateTransactionErrors } from './createTransactionErrors';

import { Transaction, TransactionStatus } from '../../domain/Transaction';
import { TransactionRepoContract } from '../../repos/transactionRepo';
import { PausedReminderRepoContract } from '../../../notifications/repos/PausedReminderRepo';
import { NotificationPause } from '../../../notifications/domain/NotificationPause';
import { Invoice, InvoiceStatus } from './../../../invoices/domain/Invoice';
import { InvoiceItem } from './../../../invoices/domain/InvoiceItem';
import { InvoiceRepoContract } from './../../../invoices/repos/invoiceRepo';
import { InvoiceItemRepoContract } from './../../../invoices/repos/invoiceItemRepo';
import { ManuscriptId } from '../../../invoices/domain/ManuscriptId';

import { JournalId } from './../../../journals/domain/JournalId';
import { CatalogItem } from './../../../journals/domain/CatalogItem';
import { CatalogRepoContract } from './../../../journals/repos/catalogRepo';

// * Authorization Logic
import type { UsecaseAuthorizationContext } from '../../../../domain/authorization';
import {
  Authorize,
  AccessControlledUsecase,
  AccessControlContext,
} from '../../../../domain/authorization';

export interface CreateTransactionRequestDTO {
  manuscriptId?: string;
  journalId?: string;
  title?: string;
  articleType?: string;
  created?: string;
  authorEmail?: string;
  authorCountry?: string;
  authorSurname?: string;
}

export class CreateTransactionUsecase
  implements
    UseCase<
      CreateTransactionRequestDTO,
      Promise<CreateTransactionResponse>,
      UsecaseAuthorizationContext
    >,
    AccessControlledUsecase<
      CreateTransactionRequestDTO,
      UsecaseAuthorizationContext,
      AccessControlContext
    > {
  constructor(
    private transactionRepo: TransactionRepoContract,
    private invoiceRepo: InvoiceRepoContract,
    private invoiceItemRepo: InvoiceItemRepoContract,
    private catalogRepo: CatalogRepoContract,
    private pausedReminderRepo: PausedReminderRepoContract
  ) {}

  private async getAccessControlContext(request, context?) {
    return {};
  }

  @Authorize('transaction:create')
  public async execute(
    request: CreateTransactionRequestDTO,
    context?: UsecaseAuthorizationContext
  ): Promise<CreateTransactionResponse> {
    let catalogItem: CatalogItem;

    //     console.log(`
    // [CreateTransactionUsecase Request Data]:
    // ${JSON.stringify(request)}
    //     `);

    const manuscriptId = ManuscriptId.create(
      new UniqueEntityID(request.manuscriptId)
    ).getValue();
    const journalId = JournalId.create(
      new UniqueEntityID(request.journalId)
    ).getValue();

    const transactionProps = {
      status: TransactionStatus.DRAFT,
    };

    try {
      // * System creates DRAFT transaction
      const transactionOrError = Transaction.create(transactionProps);
      if (transactionOrError.isFailure) {
        return left(new CreateTransactionErrors.TransactionCreatedError());
      }

      const transaction = transactionOrError.getValue();

      // * System creates DRAFT invoice
      const invoiceProps = {
        status: InvoiceStatus.DRAFT,
        transactionId: transaction.transactionId,
      };

      const invoiceOrError = Invoice.create(invoiceProps);
      if (invoiceOrError.isFailure) {
        return left(new CreateTransactionErrors.InvoiceCreatedError());
      }
      const invoice = invoiceOrError.getValue();

      //* System creates invoice item(s)
      const invoiceItemProps = {
        manuscriptId,
        invoiceId: invoice.invoiceId,
        dateCreated: new Date(),
      };

      const invoiceItemOrError = InvoiceItem.create(invoiceItemProps);
      if (invoiceItemOrError.isFailure) {
        return left(new CreateTransactionErrors.InvoiceItemCreatedError());
      }
      const invoiceItem = invoiceItemOrError.getValue();

      try {
        // * System identifies catalog item
        catalogItem = await this.catalogRepo.getCatalogItemByJournalId(
          journalId
        );
      } catch (err) {
        return left(
          new CreateTransactionErrors.CatalogItemNotFoundError(
            journalId.id.toString()
          )
        );
      }

      const reminderPause: NotificationPause = {
        invoiceId: invoice.invoiceId,
        confirmation: false,
        payment: false,
      };

      // ! If no catalog item found for a given journalId
      if (catalogItem) {
        const { amount } = catalogItem;

        // * Set price for the Invoice Item
        invoiceItem.price = amount;

        await this.invoiceRepo.save(invoice);
        await this.invoiceItemRepo.save(invoiceItem);
        await this.transactionRepo.save(transaction);
        await this.pausedReminderRepo.save(reminderPause);

        //         console.log(`
        // [CreateTransactionUsecase Result Data]:
        // ${JSON.stringify(TransactionMap.toPersistence(transaction))}
        //       `);

        //Event dispatch
        invoice.generateInvoiceDraftEvent();
        DomainEvents.dispatchEventsForAggregate(invoice.id);

        return right(Result.ok<Transaction>(transaction));
      } else {
        return left(
          new CreateTransactionErrors.CatalogItemNotFoundError(
            journalId.id.toString()
          )
        );
      }
    } catch (err) {
      return left(new UnexpectedError(err));
    }
  }
}
