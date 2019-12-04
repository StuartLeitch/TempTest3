import {
  Invoice,
  Payer,
  InvoiceItem,
  Address,
  Article
} from '@hindawi/shared';

export interface ErpData {
  invoice: Invoice;
  items: InvoiceItem[];
  payer: Payer;
  article: Article;
  billingAddress: Address;
  journalName?: string;
  vatNote?: object
  rate?: number
}

export interface ErpResponse {
  accountId: string;
  tradeDocumentId: string;
  tradeItemIds: string[];
}

export interface ErpServiceContract {
  registerInvoice(data: ErpData): Promise<ErpResponse>;
}
