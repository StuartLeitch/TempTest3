import { AbstractBaseDBRepo } from '../../../../infrastructure/AbstractBaseDBRepo';
import { Knex, TABLES } from '../../../../infrastructure/database/knex';
import { RepoError } from '../../../../infrastructure/RepoError';

import { WaiverAssignedCollection } from '../../domain/WaiverAssignedCollection';
import { InvoiceItemId } from '../../../invoices/domain/InvoiceItemId';
import { WaiverType, Waiver } from '../../domain/Waiver';

import { WaiverMap } from '../../mappers/WaiverMap';

import { WaiverRepoContract } from '../waiverRepo';

export class KnexWaiverRepo
  extends AbstractBaseDBRepo<Knex, Waiver>
  implements WaiverRepoContract {
  async getWaiversByInvoiceItemId(
    invoiceItemId: InvoiceItemId
  ): Promise<WaiverAssignedCollection> {
    const waivers = await this.db
      .select(
        `${TABLES.INVOICE_ITEMS_TO_WAIVERS}.dateCreated as dateAssigned`,
        `${TABLES.INVOICE_ITEMS_TO_WAIVERS}.invoiceItemId`,
        `${TABLES.WAIVERS}.type_id`
      )
      .from(TABLES.INVOICE_ITEMS_TO_WAIVERS)
      .join(
        TABLES.WAIVERS,
        `${TABLES.INVOICE_ITEMS_TO_WAIVERS}.waiverId`,
        '=',
        `${TABLES.WAIVERS}.type_id`
      )
      .where({
        [`${TABLES.INVOICE_ITEMS_TO_WAIVERS}.invoiceItemId`]: invoiceItemId.id.toString(),
      });

    return WaiverMap.toDomainCollection(waivers);
  }

  async getWaivers(): Promise<Waiver[]> {
    const waivers = await this.db.select().from(TABLES.WAIVERS);

    return waivers.map((w) => WaiverMap.toDomain(w));
  }

  async attachWaiverToInvoiceItem(
    waiverType: WaiverType,
    invoiceItemId: InvoiceItemId,
    dateCreated?: Date
  ): Promise<Waiver> {
    let toInsert: any = {
      invoiceItemId: invoiceItemId.id.toString(),
      waiverId: waiverType,
    };

    if (dateCreated) {
      toInsert = { ...toInsert, dateCreated };
    }

    try {
      console.log(JSON.stringify(toInsert, null, 2));
      await this.db(TABLES.INVOICE_ITEMS_TO_WAIVERS).insert(toInsert);
    } catch (e) {
      throw RepoError.fromDBError(e);
    }

    return await this.getWaiversByTypes([waiverType])[0];
  }

  async removeInvoiceItemWaivers(invoiceItemId: InvoiceItemId): Promise<void> {
    const itemsIds = [invoiceItemId.id.toString()];
    try {
      await this.db(TABLES.INVOICE_ITEMS_TO_WAIVERS)
        .whereIn('invoiceItemId', itemsIds)
        .del();
    } catch (e) {
      throw RepoError.fromDBError(e);
    }
  }

  async getWaiversByTypes(waiverTypes: WaiverType[]): Promise<Waiver[]> {
    const waivers = await this.db
      .select()
      .from(TABLES.WAIVERS)
      .whereIn('type_id', waiverTypes);

    return waivers.map((w) => WaiverMap.toDomain(w));
  }

  async getWaiverByType(waiverType: WaiverType): Promise<Waiver> {
    const waiver = await this.db
      .select()
      .from(TABLES.WAIVERS)
      .where({ type_id: waiverType })
      .first();

    if (!waiver) {
      throw RepoError.createEntityNotFoundError('waiver', waiverType);
    }

    return waiver;
  }

  async exists(waiver: Waiver): Promise<boolean> {
    try {
      this.getWaiverByType(waiver.waiverType);
    } catch (error) {
      return false;
    }
    return true;
  }

  async save(waiver: Waiver): Promise<Waiver> {
    const { db } = this;

    const rawWaiver = WaiverMap.toPersistence(waiver);

    try {
      await db(TABLES.WAIVERS).insert(rawWaiver);
    } catch (e) {
      throw RepoError.fromDBError(e);
    }

    return this.getWaiverByType(waiver.waiverType);
  }
}
