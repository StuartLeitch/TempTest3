import {UniqueEntityID} from '../../../core/domain/UniqueEntityID';
import {Mapper} from '../../../infrastructure/Mapper';

import {Invoice} from '../domain/Invoice';
import {TransactionId} from '../../transactions/domain/TransactionId';

export class InvoiceMap extends Mapper<Invoice> {
  public static toDomain(raw: any): Invoice {
    const invoiceOrError = Invoice.create(
      {
        transactionId: TransactionId.create(
          new UniqueEntityID(raw.transactionId)
        ),
        status: raw.status,
        dateCreated: new Date(raw.dateCreated)
      },
      new UniqueEntityID(raw.id)
    );

    invoiceOrError.isFailure ? console.log(invoiceOrError) : '';

    return invoiceOrError.isSuccess ? invoiceOrError.getValue() : null;
  }

  public static toPersistence(invoice: Invoice): any {
    return {
      id: invoice.id.toString(),
      transactionId: invoice.transactionId.id.toString(),
      status: invoice.status,
      dateCreated: invoice.dateCreated
    };
  }
}
