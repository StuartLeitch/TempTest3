import {BaseMockRepo} from '../../../../core/tests/mocks/BaseMockRepo';

import {InvoiceItemRepoContract} from '../invoiceItemRepo';
import {InvoiceItem} from '../../domain/InvoiceItem';
import {InvoiceItemId} from '../../domain/InvoiceItemId';

export class MockInvoiceItemRepo extends BaseMockRepo<InvoiceItem>
  implements InvoiceItemRepoContract {
  constructor() {
    super();
  }

  public async getInvoiceItemById(
    invoiceItemId: InvoiceItemId
  ): Promise<InvoiceItem> {
    const matches = this._items.filter(i => i.invoiceId.equals(invoiceItemId));
    if (matches.length !== 0) {
      return matches[0];
    } else {
      return null;
    }
  }

  // public async getInvoicesByTransactionId(
  //   transactionId: TransactionId
  // ): Promise<Invoice[]> {
  //   const matches = this._items.filter(i =>
  //     i.transactionId.equals(transactionId)
  //   );
  //   if (matches.length !== 0) {
  //     return matches;
  //   } else {
  //     return null;
  //   }
  // }

  public async getInvoiceItemCollection(): Promise<InvoiceItem[]> {
    return this._items;
  }

  public async save(invoiceItem: InvoiceItem): Promise<InvoiceItem> {
    const alreadyExists = await this.exists(invoiceItem);

    if (alreadyExists) {
      this._items.map(i => {
        if (this.compareMockItems(i, invoiceItem)) {
          return invoiceItem;
        } else {
          return i;
        }
      });
    } else {
      this._items.push(invoiceItem);
    }

    return invoiceItem;
  }

  public async update(invoiceItem: InvoiceItem): Promise<InvoiceItem> {
    const alreadyExists = await this.exists(invoiceItem);

    if (alreadyExists) {
      this._items.map(i => {
        if (this.compareMockItems(i, invoiceItem)) {
          return invoiceItem;
        } else {
          return i;
        }
      });
    }

    return invoiceItem;
  }

  public async delete(invoiceItem: InvoiceItem): Promise<boolean> {
    return true;
  }

  public async exists(invoiceItem: InvoiceItem): Promise<boolean> {
    const found = this._items.filter(i =>
      this.compareMockItems(i, invoiceItem)
    );
    return found.length !== 0;
  }

  public compareMockItems(a: InvoiceItem, b: InvoiceItem): boolean {
    return a.id.equals(b.id);
  }
}
