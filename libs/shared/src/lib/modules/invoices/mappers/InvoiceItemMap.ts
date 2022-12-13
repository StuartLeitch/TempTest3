import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { GuardFailure } from '../../../core/logic/GuardFailure';
import { Mapper } from '../../../infrastructure/Mapper';
import { Either } from '../../../core/logic/Either';

import { InvoiceItemType, InvoiceItem } from '../domain/InvoiceItem';
import { ManuscriptId } from '../../manuscripts/domain/ManuscriptId';
import { InvoiceId } from '../domain/InvoiceId';

export interface InvoiceItemPersistenceDTO {
  id?: string;
  invoiceId: string;
  manuscriptId: string;
  type?: InvoiceItemType;
  price?: number;
  vat?: number;
  taDiscount?: number;
  taCode?: string;
  dateCreated?: Date;
}

export class InvoiceItemMap extends Mapper<InvoiceItem> {
  public static toDomain(
    raw: InvoiceItemPersistenceDTO
  ): Either<GuardFailure, InvoiceItem> {
    return InvoiceItem.create(
      {
        invoiceId: InvoiceId.create(new UniqueEntityID(raw.invoiceId)),
        manuscriptId: ManuscriptId.create(new UniqueEntityID(raw.manuscriptId)),
        type: raw.type,
        price: raw.price,
        vat: raw.vat,
        taDiscount: raw.taDiscount,
        taCode: raw.taCode,
        dateCreated: new Date(raw.dateCreated),
      },
      new UniqueEntityID(raw.id)
    );
  }

  public static toPersistence(
    invoiceItem: InvoiceItem
  ): InvoiceItemPersistenceDTO {
    return {
      id: invoiceItem.id.toString(),
      invoiceId: invoiceItem.invoiceId.id.toString(),
      manuscriptId: invoiceItem.manuscriptId.id.toString(),
      type: invoiceItem.type,
      price: invoiceItem.price,
      vat: invoiceItem.vat,
      taDiscount: invoiceItem.taDiscount,
      taCode: invoiceItem.taCode,
      dateCreated: invoiceItem.dateCreated,
    };
  }
}
