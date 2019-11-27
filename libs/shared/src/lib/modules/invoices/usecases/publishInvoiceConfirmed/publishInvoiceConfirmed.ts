import { AppError } from '../../../../core/logic/AppError';
import { SQSPublishServiceContract } from '../../../../domain/services/SQSPublishService';
import { Invoice } from '../../domain/Invoice';
import { InvoiceMap } from '../../mappers/InvoiceMap';
import { InvoiceItem } from '../../domain/InvoiceItem';
import { Payer } from '../../../payers/domain/Payer';
import { InvoiceItemMap } from '../../mappers/InvoiceItemMap';
import { PayerMap } from '../../../payers/mapper/Payer';
import { Manuscript } from '../../../manuscripts/domain/Manuscript';
import { Address } from '../../../addresses/domain/Address';

export class PublishInvoiceConfirmed {
  constructor(private publishService: SQSPublishServiceContract) {}
  public async execute(
    invoice: Invoice,
    invoiceItems: InvoiceItem[],
    manuscript: Manuscript,
    payer: Payer,
    address: Address
  ): Promise<any> {
    const message = {
      event: 'invoiceConfirmed',
      data: {
        invoiceId: invoice.id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        invoiceIssueDate: invoice.dateIssued,
        invoiceItems: invoiceItems.map(InvoiceItemMap.toPersistence),
        manuscriptCustomId: manuscript.customId,
        transactionId: invoice.transactionId.id.toString(),
        invoiceStatus: invoice.status,
        payerEmail: payer.email.value.toString(),
        payerType: payer.type,
        address: `${address.addressLine1}, ${address.city}, ${address.country}`,
        country: address.country,
        costWithoutVAT: invoiceItems
          .map(ii => ii.price)
          .reduce((a, c) => a + c, 0)
        // VAT: "todo"
        // couponId: coupon.id,
        // dateApplied: coupon.applied
      }
    };

    try {
      await this.publishService.publishMessage(message);
    } catch (err) {
      throw new AppError.UnexpectedError(err.toString());
    }
  }
}
