/* eslint-disable @nrwl/nx/enforce-module-boundaries */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { format, getYear } from 'date-fns';
import knex from 'knex';

import {
  ErpServiceContract,
  PayerType,
  Payer,
  Payment,
  PaymentMethod,
  Manuscript,
  Invoice,
  InvoiceItem,
} from '@hindawi/shared';

import {
  // ErpServiceContract,
  ErpInvoiceRequest,
  ErpInvoiceResponse,
  ErpRevRecResponse,
  ErpRevRecRequest,
} from './../../../../../libs/shared/src/lib/domain/services/ErpService';

import { Connection } from './netsuite/Connection';
import { ConnectionConfig } from './netsuite/ConnectionConfig';

type CustomerPayload = Record<string, string | boolean>;

export class NetSuiteService implements ErpServiceContract {
  private constructor(private connection: Connection) {}

  get invoiceErpRefFieldName(): string {
    return 'nsReference';
  }

  get invoiceRevenueRecRefFieldName(): string {
    return 'nsRevRecReference';
  }

  public static create(config: Record<string, unknown>): NetSuiteService {
    const connection = new Connection({
      config: new ConnectionConfig(config.connection),
    });
    const service = new NetSuiteService(connection);

    return service;
  }

  public async registerInvoice(
    data: ErpInvoiceRequest
  ): Promise<ErpInvoiceResponse> {
    // console.log('ERP Data:');
    // console.info(data);

    const customerId = await this.getCustomerId(data);

    const response = await this.createInvoice({
      customerId,
      customSegmentId: data.customSegmentId,
      invoice: data.invoice,
      itemId: data.itemId,
      items: data.items,
      journalName: data.journalName,
      manuscript: data.manuscript,
      taxRateId: data.taxRateId,
    });
    return {
      tradeDocumentId: String(response),
      tradeItemIds: null,
      accountId: null,
    };
  }

  public async registerRevenueRecognition(
    data: ErpRevRecRequest
  ): Promise<ErpRevRecResponse> {
    // console.log('registerRevenueRecognition Data:');
    // console.info(data);

    const {
      publisherCustomValues: { customSegmentId },
    } = data;
    const customerId = await this.getCustomerId(data);

    /**
     * * Hindawi will be accounts: debit id "376", credit id: "401"
     * * Partnerships will be accounts: debit id "377", credit id: "402"
     **/
    const idMap = {
      Hindawi: {
        debit: 376,
        credit: 401,
      },
      Partnership: {
        debit: 377,
        credit: 402,
      },
    };

    let creditAccountId;
    let debitAccountId;
    if (customSegmentId !== '4') {
      creditAccountId = idMap.Partnership.credit;
      debitAccountId = idMap.Partnership.debit;
    } else {
      creditAccountId = idMap.Hindawi.credit;
      debitAccountId = idMap.Hindawi.debit;
    }

    const revenueRecognition = await this.createRevenueRecognition({
      ...data,
      customerId,
      creditAccountId,
      debitAccountId,
      customSegmentId,
    });

    return {
      journal: { id: String(revenueRecognition) },
      journalItem: null,
      journalTags: null,
      journalItemTag: null,
    };
  }

  public async registerCreditNote(
    data: ErpInvoiceRequest
  ): Promise<ErpInvoiceResponse> {
    // console.log('registerCreditNote Data:');
    // console.info(data);

    const creditNoteId = await this.transformCreditNote(data);
    await this.patchCreditNote({ ...data, creditNoteId });
    return creditNoteId;
  }

  public async registerPayment(data: {
    manuscript: Manuscript;
    payer: Payer;
    invoice: Invoice;
    items: InvoiceItem[];
    payments: Payment[];
    paymentMethods: PaymentMethod[];
    total: number;
    journalName: string;
    customSegmentId: string;
    taxRateId: string;
    itemId: string;
  }): Promise<ErpInvoiceResponse> {
    // console.log('registerPayment Data:');
    // console.info(data);

    const { payer, manuscript } = data;

    const customerAlreadyExists = await this.queryCustomer(
      this.getCustomerPayload(payer, manuscript)
    );
    if (!customerAlreadyExists) {
      console.error(
        `Customer does not exists for article: ${manuscript.customId}.`
      );
    }
    const paymentId = await this.createPayment({
      ...data,
      customerId: customerAlreadyExists.id,
    });

    return paymentId;
  }

  private async getCustomerId(data: { payer: Payer; manuscript: Manuscript }) {
    const { payer, manuscript } = data;

    let customerId;

    const customerAlreadyExists = await this.queryCustomer(
      this.getCustomerPayload(payer, manuscript)
    );

    if (customerAlreadyExists) {
      if (
        (customerAlreadyExists.isperson === 'T' &&
          payer.type === PayerType.INSTITUTION) ||
        (customerAlreadyExists.isperson === 'F' &&
          payer.type !== PayerType.INSTITUTION)
      ) {
        customerId = await this.createCustomer(data);
      } else {
        customerId = customerAlreadyExists.id;
      }
    } else {
      customerId = await this.createCustomer(data);
    }

    return customerId;
  }

  private async queryCustomer(customer: CustomerPayload) {
    const {
      connection: { config, oauth, token },
    } = this;

    // * Query customers
    const queryCustomerRequestOpts = {
      url: `${config.endpoint}query/v1/suiteql`,
      method: 'POST',
    };

    const queryBuilder = knex({ client: 'pg' });
    let query = queryBuilder.raw(
      'select id, companyName, email, isPerson, dateCreated from customer where email = ?',
      [customer.email]
    );
    if (customer.lastName) {
      query = queryBuilder.raw(`${query.toQuery()} and lastName = ?`, [
        customer.lastName,
      ]);
    }
    if (customer.companyName) {
      query = queryBuilder.raw(`${query.toQuery()} and companyName = ?`, [
        customer.companyName,
      ]);
    }

    const queryCustomerRequest = {
      q: query.toQuery(),
    };

    try {
      const res = await axios({
        ...queryCustomerRequestOpts,
        headers: {
          prefer: 'transient',
          ...oauth.toHeader(oauth.authorize(queryCustomerRequestOpts, token)),
        },
        data: queryCustomerRequest,
      } as AxiosRequestConfig);

      return res?.data?.items?.pop();
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private async createCustomer(data: { payer: Payer; manuscript: Manuscript }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const { payer, manuscript } = data;

    let newCustomerId = null;

    // * Create Customer
    const createCustomerRequestOpts = {
      url: `${config.endpoint}record/v1/customer`,
      method: 'POST',
    };

    const createCustomerPayload = this.getCustomerPayload(payer, manuscript);

    try {
      const res = await axios({
        ...createCustomerRequestOpts,
        headers: oauth.toHeader(
          oauth.authorize(createCustomerRequestOpts, token)
        ),
        data: createCustomerPayload,
      } as AxiosRequestConfig);

      newCustomerId = res?.headers?.location?.split('/').pop();
      return newCustomerId;
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err, isAuthError: true } as unknown;
    }
  }

  private async createInvoice(data: {
    invoice: Invoice;
    items: InvoiceItem[];
    manuscript: Manuscript;
    journalName: string;
    customSegmentId: string;
    taxRateId: string;
    itemId: string;
    customerId: string;
  }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const {
      invoice,
      items: [item],
      manuscript,
      journalName,
      customerId,
      customSegmentId,
      itemId,
      taxRateId,
    } = data;

    const invoiceRequestOpts = {
      url: `${config.endpoint}record/v1/invoice`,
      method: 'POST',
    };

    const createInvoicePayload: Record<string, any> = {
      tranDate: format(
        new Date(invoice.dateIssued),
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
      ), // '2020-07-01T14:09:00Z',
      saleseffectivedate: format(
        new Date(invoice.dateAccepted),
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
      ), // '2020-07-01T12:00:12.857Z',
      tranId: invoice.referenceNumber,
      entity: {
        id: customerId,
      },
      item: {
        items: [
          {
            amount: item.calculateNetPrice(),
            description: `${journalName} - Article Processing Charges for ${manuscript.customId}`,
            quantity: 1.0,
            rate: item.price,
            excludeFromRateRequest: false,
            printItems: false,
            item: {
              id: itemId,
            },
            taxCode: {
              id: taxRateId,
            },
          },
        ],
      },
    };

    if (customSegmentId !== '4') {
      createInvoicePayload.cseg1 = {
        id: customSegmentId,
      };
    }

    try {
      const res = await axios({
        ...invoiceRequestOpts,
        headers: oauth.toHeader(oauth.authorize(invoiceRequestOpts, token)),
        data: createInvoicePayload,
      } as AxiosRequestConfig);

      return res?.headers?.location?.split('/').pop();
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private async createPayment(data: {
    invoice: Invoice;
    items: InvoiceItem[];
    payments: Payment[];
    paymentMethods: PaymentMethod[];
    total: number;
    manuscript: Manuscript;
    journalName: string;
    customSegmentId: string;
    taxRateId: string;
    itemId: string;
    customerId?: string;
  }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const { invoice, payments, paymentMethods, total, customerId } = data;

    const accountMap = {
      Paypal: '213',
      'Credit Card': '216',
      'Bank Transfer': '347',
    };

    const paymentRequestOpts = {
      // url: `${config.endpoint}record/v1/invoice/${invoice.nsReference}/!transform/customerpayment`,
      method: 'POST',
    };

    const [payment] = payments;
    const [paymentAccount] = paymentMethods.filter((pm) =>
      pm.id.equals(payment.paymentMethodId.id)
    );

    const createPaymentPayload = {
      account: {
        id: accountMap[paymentAccount.name],
      },
      createdDate: format(
        new Date(payment.datePaid),
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
      ),
      entity: {
        id: customerId,
      },
      // Invoice reference number,
      refName: `Invoice #${invoice.referenceNumber}`,
      // Original amount,
      total,
      // Amount due,
      payment: payment.amount.value,
    };

    try {
      const res = await axios({
        ...paymentRequestOpts,
        headers: oauth.toHeader(oauth.authorize(paymentRequestOpts, token)),
        data: createPaymentPayload,
      } as AxiosRequestConfig);

      return res?.headers?.location?.split('/').pop();
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private async queryAccount(data: { payer: Payer }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const { payer } = data;

    // * Query customers
    const queryAccountRequestOpts = {
      url: `${config.endpoint}query/v1/suiteql`,
      method: 'POST',
    };

    const queryAccountRequest = {
      q: `SELECT id, companyName, email, dateCreated FROM account WHERE email = '${payer?.email?.toString()}'`,
    };

    try {
      const res = await axios({
        ...queryAccountRequestOpts,
        headers: oauth.toHeader(
          oauth.authorize(queryAccountRequestOpts, token)
        ),
        data: queryAccountRequest,
      } as AxiosRequestConfig);

      return res?.data?.items?.pop();
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private async createRevenueRecognition(data: {
    invoice: Invoice;
    invoiceTotal: number;
    creditAccountId: string;
    debitAccountId: string;
    customerId: string;
    customSegmentId: string;
  }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const {
      invoice,
      invoiceTotal,
      creditAccountId,
      debitAccountId,
      customerId,
      customSegmentId,
    } = data;

    const journalRequestOpts = {
      url: `${config.endpoint}record/v1/journalentry`,
      method: 'POST',
    };

    const createJournalPayload: Record<string, unknown> = {
      approved: true,
      tranId: `Revenue Recognition - ${invoice.referenceNumber}`,
      // trandate: format(
      //   new Date(article.datePublished),
      //   "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
      // ),
      memo: `${invoice.referenceNumber}`,
      entity: {
        id: customerId,
      },
      line: {
        items: [
          {
            memo: `${invoice.referenceNumber}`,
            account: {
              id: debitAccountId,
            },
            debit: invoiceTotal,
          },
          {
            memo: `${invoice.referenceNumber}`,
            account: {
              id: creditAccountId,
            },
            credit: invoiceTotal,
          },
        ],
      },
    };

    if (customSegmentId !== '4') {
      createJournalPayload.cseg1 = {
        id: customSegmentId,
      };
    }

    try {
      const res = await axios({
        ...journalRequestOpts,
        headers: oauth.toHeader(oauth.authorize(journalRequestOpts, token)),
        data: createJournalPayload,
      } as AxiosRequestConfig);

      const journalId = res?.headers?.location?.split('/').pop();
      await this.patchInvoice({ ...data, journalId });
      return journalId;
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private async patchInvoice(data: { invoice: Invoice; journalId: string }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const { invoice, journalId } = data;

    const invoiceRequestOpts = {
      // url: `${config.endpoint}record/v1/invoice/${invoice.nsReference}`,
      method: 'PATCH',
    };

    const patchInvoicePayload: Record<string, unknown> = {
      custbody_bbs_revenue_journal: {
        id: journalId,
        refName: `Journal #${journalId}`,
      },
    };

    try {
      await axios({
        ...invoiceRequestOpts,
        headers: oauth.toHeader(oauth.authorize(invoiceRequestOpts, token)),
        data: patchInvoicePayload,
      } as AxiosRequestConfig);
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private async transformCreditNote(data: { originalInvoice?: Invoice }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const { originalInvoice } = data;

    const creditNoteTransformOpts = {
      // url: `${config.endpoint}record/v1/invoice/${originalInvoice.nsReference}/!transform/creditmemo`,
      method: 'POST',
    };

    try {
      const res = await axios({
        ...creditNoteTransformOpts,
        headers: oauth.toHeader(
          oauth.authorize(creditNoteTransformOpts, token)
        ),
        data: {},
      } as AxiosRequestConfig);

      return res?.headers?.location?.split('/').pop();
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private async patchCreditNote(data: {
    creditNote?: Invoice;
    creditNoteId?: string;
  }) {
    const {
      connection: { config, oauth, token },
    } = this;
    const { creditNote, creditNoteId } = data;

    const creditNoteRequestOpts = {
      url: `${config.endpoint}record/v1/creditmemo/${creditNoteId}`,
      method: 'PATCH',
    };

    let creationYear = creditNote.dateAccepted.getFullYear();
    if (
      creditNote.dateIssued &&
      getYear(creditNote.dateIssued) < getYear(creditNote.dateAccepted)
    ) {
      creationYear = creditNote.dateIssued.getFullYear();
    }

    const { creationReason } = creditNote;
    let memo = 'Other';
    switch (creationReason) {
      case 'withdrawn-manuscript':
        memo = 'Withdrawn Manuscript';
        break;
      case 'reduction-applied':
        memo = 'Reduction Applied';
        break;
      case 'waived-manuscript':
        memo = 'Waived Manuscript';
        break;
      case 'change-payer-details':
        memo = 'Change Payer Details';
        break;
    }

    const patchCreditNotePayload: Record<string, any> = {
      tranId: `CN-${creditNote.invoiceNumber}/${creationYear}`,
      memo,
    };

    try {
      const res = await axios({
        ...creditNoteRequestOpts,
        headers: oauth.toHeader(oauth.authorize(creditNoteRequestOpts, token)),
        data: patchCreditNotePayload,
      } as AxiosRequestConfig);

      return res?.headers?.location?.split('/').pop();
    } catch (err) {
      console.error(err);
      // throw new Error('Unable to establish a login session.'); // here I'd like to send the error to the user instead
      return { err } as unknown;
    }
  }

  private getCustomerPayload(
    payer: Payer,
    manuscript: Manuscript
  ): CustomerPayload {
    const MAX_LENGTH = 32;
    const createCustomerPayload: Record<string, string | boolean> = {
      email: payer?.email.toString(),
    };

    const keep = ` ${manuscript.customId.toString()}`;
    if (payer?.type !== PayerType.INSTITUTION) {
      createCustomerPayload.isPerson = true;
      const [firstName, ...lastNames] = payer?.name.toString().split(' ');
      createCustomerPayload.firstName = firstName;

      createCustomerPayload.lastName =
        lastNames.length > 0
          ? `${lastNames.join(' ')} ${keep}`.trim()
          : `${keep}`.trim();

      if (createCustomerPayload?.lastName?.length > MAX_LENGTH) {
        createCustomerPayload.lastName =
          createCustomerPayload?.lastName?.slice(0, MAX_LENGTH - keep.length) +
          keep;
      }
    } else {
      createCustomerPayload.isPerson = false;
      createCustomerPayload.companyName = `${
        payer?.organization.toString() || payer?.name.toString()
      } ${keep}`.trim();
      if (createCustomerPayload.companyName.length > MAX_LENGTH) {
        createCustomerPayload.companyName =
          createCustomerPayload.companyName.slice(0, MAX_LENGTH - keep.length) +
          keep;
      }
      createCustomerPayload.vatRegNumber = payer.VATId?.slice(0, 20);
    }

    return createCustomerPayload;
  }
}
