import { cloneDeep } from 'lodash';
import { BaseMockRepo } from '../../../../core/tests/mocks/BaseMockRepo';

import { GetRecentCreditNotesSuccessResponse } from '../../usecases/getRecentCreditNotes/getRecentCreditNotesResponse';
import { CreditNoteRepoContract } from './../creditNoteRepo';
import { CreditNote } from '../../domain/CreditNote';
import { CreditNoteId } from '../../domain/CreditNoteId';

import { InvoiceId } from '../../../invoices/domain/InvoiceId';
import { CreditNoteMap } from '../../mappers/CreditNoteMap';

export class MockCreditNoteRepo
  extends BaseMockRepo<CreditNote>
  implements CreditNoteRepoContract {
  constructor() {
    super();
  }

  public async getCreditNoteByInvoiceId(
    invoiceId: InvoiceId
  ): Promise<CreditNote> {
    const match = this._items.find((i) => i.invoiceId.id.equals(invoiceId.id));

    return match ? match : null;
  }

  public async getCreditNoteById(
    creditNoteId: CreditNoteId
  ): Promise<CreditNote> {
    let filterCreditNoteById = null;
    filterCreditNoteById = this.filterCreditNoteById(creditNoteId);
    if (!filterCreditNoteById) {
      return null;
    }

    return CreditNoteMap.toDomain({
      ...CreditNoteMap.toPersistence(filterCreditNoteById),
    });
  }

  public async getCreditNoteByReferenceNumber(
    referenceNumber: string
  ): Promise<CreditNote> {
    const match = this._items.find((i) =>
      i.persistentReferenceNumber.includes(referenceNumber)
    );
    return match ? match : null;
  }

  async existsWithId(creditNoteId: CreditNoteId): Promise<boolean> {
    const match = this._items.filter((i) => i.invoiceId.equals(creditNoteId));
    return match.length !== 0;
  }

  public async getUnregisteredErpCreditNotes(): Promise<CreditNoteId[]> {
    return null;
  }

  public async getCreditNoteByCustomId(customId: string): Promise<CreditNote> {
    return null;
  }

  async getRecentCreditNotes(): Promise<GetRecentCreditNotesSuccessResponse> {
    return {
      totalCount: this._items.length,
      creditNotes: this._items,
    };
  }

  public async update(creditNote: CreditNote): Promise<CreditNote> {
    const alreadyExists = await this.exists(creditNote);

    if (alreadyExists) {
      this._items = this._items.map((i) => {
        if (this.compareMockItems(i, creditNote)) {
          return creditNote;
        } else {
          return i;
        }
      });
    }

    return cloneDeep(creditNote);
  }

  public async save(creditNote: CreditNote): Promise<CreditNote> {
    const alreadyExists = await this.exists(creditNote);

    if (alreadyExists) {
      this._items = this._items.map((i) => {
        if (this.compareMockItems(i, creditNote)) {
          return creditNote;
        } else {
          return i;
        }
      });
    } else {
      this._items.push(creditNote);
    }
    return cloneDeep(creditNote);
  }

  public async exists(creditNote: CreditNote): Promise<boolean> {
    const found = this._items.filter((i) =>
      this.compareMockItems(i, creditNote)
    );
    return found.length !== 0;
  }

  public compareMockItems(a: CreditNote, b: CreditNote): boolean {
    return a.id.equals(b.id);
  }

  private filterCreditNoteById(creditNoteId: CreditNoteId) {
    const found = this._items.find((item) => item.id.equals(creditNoteId.id));

    if (!found) {
      return null;
    }

    return found;
  }
}
