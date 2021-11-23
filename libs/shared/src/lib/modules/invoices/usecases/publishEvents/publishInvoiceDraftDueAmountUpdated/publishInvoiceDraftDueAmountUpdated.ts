import { InvoiceDraftDueAmountUpdated } from '@hindawi/phenom-events';

import { Either, right, left } from '../../../../../core/logic/Either';
import { UseCase } from '../../../../../core/domain/UseCase';

import { EventUtils } from '../../../../../utils/EventUtils';

// * Authorization Logic
import type { UsecaseAuthorizationContext as Context } from '../../../../../domain/authorization';

import { SQSPublishServiceContract } from '../../../../../domain/services/SQSPublishService';
import { formatInvoiceItems, formatCosts } from '../eventFormatters';

import { PublishInvoiceDraftDueAmountUpdatedResponse as Response } from './publishInvoiceDraftDueAmountUpdated.response';
import { PublishInvoiceDraftDueAmountUpdatedDTO as DTO } from './publishInvoiceDraftDueAmountUpdated.dto';
import * as Errors from './publishInvoiceDraftDueAmountUpdated.errors';

const INVOICE_DRAFT_DUE_AMOUNT_UPDATED = 'InvoiceDraftDueAmountUpdated';

export class PublishInvoiceDraftDueAmountUpdatedUseCase
  implements UseCase<DTO, Promise<Response>, Context> {
  constructor(private publishService: SQSPublishServiceContract) {}

  public async execute(request: DTO, context?: Context): Promise<Response> {
    const maybeValidRequest = this.verifyInput(request);
    if (maybeValidRequest.isLeft()) {
      return maybeValidRequest;
    }

    const { messageTimestamp, invoiceItems, manuscript, invoice } = request;

    const erpReference = invoice
      .getErpReferences()
      .getItems()
      .filter(
        (er) => er.vendor === 'netsuite' && er.attribute === 'confirmation'
      )
      .find(Boolean);

    const data: InvoiceDraftDueAmountUpdated = {
      ...EventUtils.createEventObject(),
      transactionId: invoice.transactionId.toString(),
      referenceNumber: invoice.persistentReferenceNumber,
      erpReference: erpReference?.value ?? null,
      invoiceId: invoice.id.toString(),
      invoiceStatus: invoice.status,
      isCreditNote: false,

      invoiceFinalizedDate: invoice?.dateMovedToFinal?.toISOString(),
      invoiceCreatedDate: invoice?.dateCreated?.toISOString(),
      invoiceIssuedDate: invoice?.dateIssued?.toISOString(),
      lastPaymentDate: null,

      costs: formatCosts(invoiceItems, []),

      invoiceItems: formatInvoiceItems(invoiceItems, manuscript.customId),

      preprintValue: manuscript.preprintValue,
    };

    try {
      await this.publishService.publishMessage({
        timestamp: messageTimestamp?.toISOString(),
        event: INVOICE_DRAFT_DUE_AMOUNT_UPDATED,
        data,
      });
      return right(null);
    } catch (err) {
      return left(new Errors.SQSServiceFailure(err));
    }
  }

  private verifyInput(
    request: DTO
  ): Either<
    | Errors.InvoiceItemsRequiredError
    | Errors.InvoiceRequiredError
    | Errors.ManuscriptRequiredError,
    void
  > {
    if (!request.invoiceItems) {
      return left(new Errors.InvoiceItemsRequiredError());
    }

    if (!request.manuscript) {
      return left(new Errors.ManuscriptRequiredError());
    }

    if (!request.invoice) {
      return left(new Errors.InvoiceRequiredError());
    }

    return right(null);
  }
}
