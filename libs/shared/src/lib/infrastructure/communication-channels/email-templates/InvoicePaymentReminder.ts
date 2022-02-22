import { format, differenceInCalendarDays } from 'date-fns';

import { EmailContent } from '../EmailProps';

import { CatalogItem } from '../../../modules/journals/domain/CatalogItem';
import { Invoice } from '../../../modules/invoices/domain/Invoice';

export interface PaymentReminderBuildData {
  manuscriptCustomId: string;
  catalogItem: CatalogItem;
  invoice: Invoice;
  invoiceButton: string;
  publisherName: string;
  publisherSite: string;
  antiFraudSupportEmail: string;
  antiFraudPolicyUrl: string;
}

export class InvoicePaymentFirstReminderTemplate {
  static build({
    manuscriptCustomId,
    catalogItem,
    invoice,
    invoiceButton,
    publisherName,
    publisherSite,
    antiFraudSupportEmail,
    antiFraudPolicyUrl,
  }: PaymentReminderBuildData): EmailContent {
    const price = `${catalogItem.currency} ${invoice.getInvoiceTotal()}`;

    const subject = `${manuscriptCustomId}: Article Processing Charges - Payment Reminder`;
    const paragraph = `
      We wanted to drop you a quick note to remind you that the invoice for manuscript ${manuscriptCustomId} in the amount of ${price} is still due for payment.<br/>
      <br/>
      You can access the invoice for your article and make payment through the following URL:
      <br/><br/>
      ${invoiceButton}

      If you have any questions related to the invoice, just reply to this email and our Customer Service team will be able to help.
      <br/><br/><br/>
      *************************************<br/>
      Customer Service Team<br/>
      ${publisherName}<br/>
      ${publisherSite}<br/>
      *************************************<br/>
      This is an automated email - if you have already paid your invoice, please ignore this email whilst we update our records.
      <br/>
      <br/>
      If you receive a suspicious email that appears to be from Hindawi, requesting payment in an alternative method, please forward it to <a href="mailto:${antiFraudSupportEmail}">${antiFraudSupportEmail}</a> for further investigation. For further information please see our <a href="${antiFraudPolicyUrl}">Fraud Prevention Policy</a>.
    `;

    return {
      paragraph,
      subject,
    };
  }
}

export class InvoicePaymentSecondReminderTemplate {
  static build({
    manuscriptCustomId,
    catalogItem,
    invoice,
    invoiceButton,
    publisherName,
    publisherSite,
    antiFraudSupportEmail,
    antiFraudPolicyUrl,
  }: PaymentReminderBuildData): EmailContent {
    const price = `${catalogItem.currency} ${invoice.getInvoiceTotal()}`;
    const issueDate = format(invoice.dateIssued, 'd MMMM yyyy');

    const subject = `${manuscriptCustomId}: Article Processing Charges - Payment Reminder`;
    const paragraph = `
      The invoice for manuscript ${manuscriptCustomId} in the amount of ${price} is still due for payment. This invoice was issued on ${issueDate}.<br/>
      <br/>
      You can access the invoice for your article and make payment through the following URL:
      <br/><br//>
      ${invoiceButton}

      If you need further assistance to make this payment, just reply to this email and our Customer Service team will be able to help.<br/>
      <br/>
      If you have already processed this payment, you can send us the receipt by email.<br/>
      <br/>
      Your swift cooperation would be appreciated.<br/>
      <br/>
      <br/>
      *************************************<br/>
      Customer Service Team<br/>
      ${publisherName}<br/>
      ${publisherSite}<br/>
      *************************************<br/>
      This is an automated email - if you have already paid your invoice, please ignore this email whilst we update our records.
      <br/>
      <br/>
      If you receive a suspicious email that appears to be from Hindawi, requesting payment in an alternative method, please forward it to <a href="mailto:${antiFraudSupportEmail}">${antiFraudSupportEmail}</a> for further investigation. For further information please see our <a href="${antiFraudPolicyUrl}">Fraud Prevention Policy</a>.
    `;

    return {
      paragraph,
      subject,
    };
  }
}

export class InvoicePaymentThirdReminderTemplate {
  static build({
    manuscriptCustomId,
    catalogItem,
    invoice,
    invoiceButton,
    publisherName,
    publisherSite,
    antiFraudSupportEmail,
    antiFraudPolicyUrl,
  }: PaymentReminderBuildData): EmailContent {
    const price = `${catalogItem.currency} ${invoice.getInvoiceTotal()}`;
    const daysNo = differenceInCalendarDays(new Date(), invoice.dateIssued);

    const subject = `${manuscriptCustomId}: Article Processing Charges - Payment Reminder`;
    const paragraph = `
      The invoice for manuscript ${manuscriptCustomId} in the amount of ${price} is still due for payment.<br/>
      <br/>
      This invoice is now ${daysNo} days overdue. If payment is not received this invoice will be escalated to our Credit Control team so we urge you to make payment as a matter of urgency.<br/>
      <br/>
      You can access the invoice for your article and make payment through the following URL:<br/>
      <br/>
      ${invoiceButton}

      If you need further assistance before you can make this payment, please reply to this email as soon as possible and our Customer Service team will be able to help.<br/>
      <br/>
      *************************************<br/>
      Customer Service Team<br/>
      ${publisherName}<br/>
      ${publisherSite}<br/>
      *************************************<br/>
      This is an automated email - if you have already paid your invoice, please ignore this email whilst we update our records.
      <br/>
      <br/>
      If you receive a suspicious email that appears to be from Hindawi, requesting payment in an alternative method, please forward it to <a href="mailto:${antiFraudSupportEmail}">${antiFraudSupportEmail}</a> for further investigation. For further information please see our <a href="${antiFraudPolicyUrl}">Fraud Prevention Policy</a>.
    `;

    return {
      paragraph,
      subject,
    };
  }
}
