type PaymentType = "INDIVIDUAL" | "INSTITUTION";

export interface Article {
  id: string;
  journal: string;
  customId: string;
  title: string;
  articleType: string;
  authorEmail: string;
  authorCountry: string;
  authorSurname: string;
  authorFirstName: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  manuscriptId: string;
  price: number;
  vat: number;
  rate: number;
  vatnote: string;
}

export interface Invoice {
  id: string;
  invoiceId: string;
  status: "DRAFT" | "ACTIVE" | "FINAL" | "PENDING" | null;
  payer: Payer | null;
  referenceNumber: string | null;
  invoiceItem: InvoiceItem | null;
  article: Article | null;
}

export interface InvoicesPagination {
  offset: number;
  limit: number;
}

export interface Address {
  city: string;
  country: string;
  addressLine1: string;
}

export interface Payer {
  id: string;
  type: PaymentType;
  name: string;
  email: string;
  organization?: string;
  address: Address;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface InvoiceState {
  invoice: any;
  payerLoading: LoadingState;
  invoiceLoading: LoadingState;
  invoicesLoading: LoadingState;
}

export interface InvoiceVATDTO {
  invoiceId: string;
  country: string;
  payerType: string;
}

export interface InvoiceVat {
  rate: number;
  vatNote: string;
  vatPercentage: number;
}
