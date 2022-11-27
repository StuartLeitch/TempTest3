export interface Address {
  addressLine1: string;
  city: string;
  country: string;
  postalCode: string | null;
  state: string;
}

export interface Article {
  articleType: string;
  authorCountry: string;
  authorEmail: string;
  authorFirstName: string;
  authorSurname: string;
  customId: string;
  datePublished: string | null;
  id: string;
  journal: string;
  title: string;
}

export interface Coupon {
  code: string;
  reduction: number;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  creationReason?: string;
  price?: number;
  vat?: number;
  dateCreated: string;
  dateIssued: string;
  dateUpdated: string;
  persistentReferenceNumber: string;
  erpReference?: ERPReferences[];
}

export interface ERPReferences {
  entityId: string;
  type: string;
  vendor: string;
  attribute: string;
  value: string;
}
export interface Invoice {
  dateCreated: string;
  dateIssued: string;
  dateMovedToFinal: string | null;
  erpReferences: ERPReferences[];
  id: string;
  invoiceId: string;
  invoiceItem: InvoiceItem | null;
  payer: Payer | null;
  payments: Payment[] | null;
  referenceNumber: string | null;
  // revenueRecognitionReference: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'FINAL' | 'PENDING' | null;
}

export interface InvoiceItem {
  article: Article | null;
  coupons: Coupon[];
  id: string;
  invoiceId: string;
  manuscriptId: string;
  price: number;
  type: string;
  vat: number;
  taDiscount: number;
  waivers: Waiver[];
}

export interface Payer {
  address: Address;
  email: string;
  id: string;
  name: string;
  organization?: string;
  type: PaymentType;
}

export interface Payment {
  amount: number;
  datePaid: string;
  foreignPaymentId: string;
  id: string;
  paymentMethod?: {
    id: string;
    name: string;
    status: string;
  };
  status: string;
}

export interface Waiver {
  id: string;
  type_id: string;
  reduction: number;
}

type PaymentType = 'INDIVIDUAL' | 'INSTITUTION';
