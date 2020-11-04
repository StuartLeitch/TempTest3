import { Repo } from '../../../infrastructure/Repo';

import { InvoiceItemId } from '../../invoices/domain/InvoiceItemId';
import { WaiverType, Waiver } from '../domain/Waiver';

export interface WaiverRepoContract extends Repo<Waiver> {
  getWaivers(): Promise<Waiver[]>;
  getWaiversByInvoiceItemId(invoiceItemId: InvoiceItemId): Promise<Waiver[]>;
  getWaiverByType(waiverType: WaiverType): Promise<Waiver>;
  getWaiversByTypes(waiverTypes: WaiverType[]): Promise<Waiver[]>;
  removeInvoiceItemWaivers(invoiceItemId: InvoiceItemId): Promise<void>;
  attachWaiverToInvoiceItem(
    waivers: WaiverType,
    invoiceItemId: InvoiceItemId,
    dateCreated?: Date
  ): Promise<Waiver>;
}
