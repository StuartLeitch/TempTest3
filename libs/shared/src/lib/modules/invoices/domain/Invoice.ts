// * Core Domain
import { AggregateRoot } from '../../../core/domain/AggregateRoot';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID';
import { Result } from '../../../core/logic/Result';

// * Subdomains
import { InvoiceId } from './InvoiceId';
import { InvoiceItem } from './InvoiceItem';
import { InvoiceItems } from './InvoiceItems';
import { InvoiceSentEvent } from './events/invoiceSent';
import { InvoicePaidEvent } from './events/invoicePaid';
import { InvoiceCreated } from './events/invoiceCreated';
import { InvoiceActivated } from './events/invoiceActivated';
import { TransactionId } from '../../transactions/domain/TransactionId';
import { PayerId } from '../../payers/domain/PayerId';
import { PaymentId } from '../../payments/domain/PaymentId';
// import {PayerType} from '../../payers/domain/PayerType';
// import {Coupon} from '../../coupons/domain/Coupon';

export enum InvoiceStatus {
  DRAFT = 'DRAFT', // after the internal object has been created
  ACTIVE = 'ACTIVE', // when the customer is being notified
  FINAL = 'FINAL' // after a resolution has been set: either it was paid, it was waived, or it has been considered bad debt
}

interface InvoiceProps {
  status: InvoiceStatus;
  invoiceNumber?: string;
  transactionId: TransactionId;
  payerId?: PayerId;
  invoiceItems?: InvoiceItems;
  dateCreated?: Date;
  dateUpdated?: Date;
  dateAccepted?: Date;
  dateIssued?: Date;
  charge?: number;
  totalNumInvoiceItems?: number;
  erpReference?: string;
  vatnote?: string;
}

export type InvoiceCollection = Invoice[];

export class Invoice extends AggregateRoot<InvoiceProps> {
  get invoiceId(): InvoiceId {
    return InvoiceId.create(this._id).getValue();
  }

  get transactionId(): TransactionId {
    return this.props.transactionId;
  }

  get payerId(): PayerId {
    return this.props.payerId;
  }

  set payerId(payerId: PayerId) {
    this.props.payerId = payerId;
  }

  get status(): InvoiceStatus {
    return this.props.status;
  }

  set status(status: InvoiceStatus) {
    this.props.status = status;
  }

  get charge(): number {
    return this.props.charge;
  }

  set charge(charge: number) {
    this.props.charge = charge;
  }

  get dateIssued(): Date {
    return this.props.dateIssued;
  }

  set dateIssued(dateIssued: Date) {
    this.props.dateIssued = dateIssued;
  }

  get dateCreated(): Date {
    return this.props.dateCreated;
  }

  get dateAccepted(): Date {
    return this.props.dateAccepted;
  }

  set dateAccepted(dateAccepted: Date) {
    this.props.dateAccepted = dateAccepted
  }

  get invoiceItems(): InvoiceItems {
    return this.props.invoiceItems;
  }

  get invoiceNumber(): string {
    return this.props.invoiceNumber;
  }

  set invoiceNumber(invoiceNumber: string) {
    this.props.invoiceNumber = invoiceNumber;
  }

  set transactionId(transactionId: TransactionId) {
    this.props.transactionId = transactionId;
  }

  get erpReference(): string {
    return this.props.erpReference;
  }

  set erpReference(erpReference: string) {
    this.props.erpReference = erpReference;
  }

  private removeInvoiceItemIfExists(invoiceItem: InvoiceItem): void {
    if (this.props.invoiceItems.exists(invoiceItem)) {
      this.props.invoiceItems.remove(invoiceItem);
    }
  }

  public addInvoiceItem(invoiceItem: InvoiceItem): Result<void> {
    this.removeInvoiceItemIfExists(invoiceItem);
    this.props.invoiceItems.add(invoiceItem);
    this.props.totalNumInvoiceItems++;
    // this.addDomainEvent(new InvoiceItemIssued(this, invoiceItem));
    return Result.ok<void>();
  }

  private constructor(props: InvoiceProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // tslint:disable-next-line
  public static create(
    props: InvoiceProps,
    id?: UniqueEntityID
  ): Result<Invoice> {
    const defaultValues = {
      ...props,
      invoiceItems: props.invoiceItems
        ? props.invoiceItems
        : InvoiceItems.create([]),
      dateCreated: props.dateCreated ? props.dateCreated : new Date()
    };

    const isNewInvoice = !!id === false;
    const invoice = new Invoice(defaultValues, id);

    if (isNewInvoice) {
      // invoice.addDomainEvent(new InvoiceCreated(invoice));
      // Create with initial invoice item from whomever created the invoice
      // invoice.addInvoiceItem(
      //   InvoiceItem.create(props.invoiceId, invoice.manuscriptId).getValue()
      // );
    }

    return Result.ok<Invoice>(invoice);
  }

  public generateCreatedEvent() {
    const now = new Date();
    this.addDomainEvent(new InvoiceCreated(this, now));
  }

  public send(): void {
    this.addDomainEvent(new InvoiceSentEvent(this.invoiceId, new Date()));
  }

  public markAsActive(): void {
    const now = new Date();
    this.props.dateUpdated = now;
    this.props.status = InvoiceStatus.ACTIVE;
    this.props.dateIssued = new Date();
    this.addDomainEvent(new InvoiceActivated(this, now));
  }

  public markAsPaid(paymentId: PaymentId): void {
    const now = new Date();
    this.props.dateUpdated = now;
    this.props.status = InvoiceStatus.FINAL;
    this.addDomainEvent(new InvoicePaidEvent(this.invoiceId, paymentId, now));
  }

  public getInvoiceTotal(): number {
    return this.invoiceItems
      .getItems()
      .reduce((acc, item) => acc + item.price, 0);
  }

  // public getValue(): number {
  //   return this.invoiceItems.reduce(
  //     (value: number, invoiceItem: InvoiceItem) => {
  //       value += invoiceItem.price;
  //       return value;
  //     },
  //     0
  //   );
  // }

  // public addInvoiceItem(invoiceItem: InvoiceItem): void {
  //   const alreadyAdded = this.props.invoiceItems.find(i =>
  //     i.id.equals(invoiceItem.id)
  //   );

  //   if (!alreadyAdded) {
  //     Object.assign(invoiceItem, {invoiceId: this.invoiceId});
  //     this.props.invoiceItems.push(invoiceItem);
  //   }
  // }

  // public removeInvoiceItems(invoiceItem: InvoiceItem): void {
  //   this.props.invoiceItems = this.props.invoiceItems.filter(
  //     i => !i.id.equals(invoiceItem.id)
  //   );
  // }

  // public clearInvoiceItems(): void {
  //   this.props.invoiceItems = [];
  // }

  // public addTax(taxRate: number) {
  //   const netAmount = this.getValue();
  //   const taxValue = (netAmount * taxRate) / 100;
  //   return netAmount + taxValue;
  // }

  // public redeemCoupon(reduction: number) {
  //   const netAmount = this.getValue();
  //   const reductionValue = netAmount * reduction;
  //   return netAmount - reductionValue;
  // }
}
