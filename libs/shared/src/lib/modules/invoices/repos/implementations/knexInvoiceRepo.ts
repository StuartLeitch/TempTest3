import { Knex, TABLES } from '../../../../infrastructure/database/knex';
import { Invoice } from '../../domain/Invoice';
import { InvoiceId } from '../../domain/InvoiceId';
import { InvoiceMap } from '../../mappers/InvoiceMap';
import { InvoiceItemId } from '../../domain/InvoiceItemId';
import { TransactionId } from './../../../transactions/domain/TransactionId';

import { InvoiceRepoContract } from '../invoiceRepo';
import { AbstractBaseDBRepo } from '../../../../infrastructure/AbstractBaseDBRepo';
import { RepoError, RepoErrorCode } from '../../../../infrastructure/RepoError';
import { InvoicePaymentInfo } from '../../domain/InvoicePaymentInfo';

import { Bundle, JoinTag } from '../../../../utils/Utils';

function filtered(src: any, filters: any) {
  if (!filters) return src;

  let here = src;

  const journalTitleFilter =
    filters?.invoices?.invoiceItem?.article?.journalTitle;
  if ('in' in journalTitleFilter && journalTitleFilter?.in?.length > 0) {
    here = here
      .join(
        TABLES.INVOICE_ITEMS,
        `${TABLES.INVOICES}.id`,
        '=',
        `${TABLES.INVOICE_ITEMS}.invoiceId`
      )
      .join(
        TABLES.ARTICLES,
        `${TABLES.ARTICLES}.id`,
        '=',
        `${TABLES.INVOICE_ITEMS}.manuscriptId`
      )
      .join(
        TABLES.CATALOG,
        `${TABLES.CATALOG}.journalId`,
        '=',
        `${TABLES.ARTICLES}.journalId`
      )
      .whereIn(`${TABLES.CATALOG}.id`, journalTitleFilter['in']);
  }

  const customIdFilter = filters?.invoices?.invoiceItem?.article?.customId;
  if ('eq' in customIdFilter && customIdFilter?.eq?.length > 0) {
    here = here
      .join(
        TABLES.INVOICE_ITEMS,
        `${TABLES.INVOICES}.id`,
        '=',
        `${TABLES.INVOICE_ITEMS}.invoiceId`
      )
      .join(
        TABLES.ARTICLES,
        `${TABLES.ARTICLES}.id`,
        '=',
        `${TABLES.INVOICE_ITEMS}.manuscriptId`
      )
      .where(`${TABLES.ARTICLES}.customId`, customIdFilter['eq']);
  }

  const transactionStatusFilter = filters?.invoices?.transaction?.status;
  if (
    'in' in transactionStatusFilter &&
    transactionStatusFilter?.in?.length > 0
  ) {
    here = here
      .join(
        TABLES.TRANSACTIONS,
        `${TABLES.INVOICES}.transactionId`,
        '=',
        `${TABLES.TRANSACTIONS}.id`
      )
      .whereIn(`${TABLES.TRANSACTIONS}.status`, transactionStatusFilter['in']);
  }

  const invoiceStatusFilter = filters?.invoices?.status;
  if ('in' in invoiceStatusFilter && invoiceStatusFilter?.in.length > 0) {
    here = here.whereIn(`${TABLES.INVOICES}.status`, invoiceStatusFilter['in']);
  }

  const referenceNumber = filters?.invoices?.referenceNumber;
  if ('eq' in referenceNumber && referenceNumber?.eq?.length > 0) {
    const [paddedNumber, creationYear] = referenceNumber.eq.split('/');
    const invoiceNumber = parseInt(paddedNumber, 10);
    here = here.whereRaw(
      `"${TABLES.INVOICES}"."invoiceNumber" = ${invoiceNumber} and extract(year from "${TABLES.INVOICES}"."dateAccepted") = ${creationYear}`
    );
  }

  return here;
}

export class KnexInvoiceRepo extends AbstractBaseDBRepo<Knex, Invoice>
  implements InvoiceRepoContract {
  public async getInvoiceById(invoiceId: InvoiceId): Promise<Invoice> {
    const { db } = this;

    const invoice = await db(TABLES.INVOICES)
      .select()
      .where('id', invoiceId.id.toString())
      .first();

    if (!invoice) {
      throw RepoError.createEntityNotFoundError(
        'invoice',
        invoiceId.id.toString()
      );
    }
    return InvoiceMap.toDomain(invoice);
  }

  public async getInvoiceByInvoiceItemId(
    invoiceItemId: InvoiceItemId
  ): Promise<Invoice> {
    const { db } = this;

    const invoice = await db(TABLES.INVOICE_ITEMS)
      .select()
      .where('id', invoiceItemId.id.toString())
      .first();

    if (!invoice) {
      throw RepoError.createEntityNotFoundError(
        'invoiceItem',
        invoiceItemId.id.toString()
      );
    }

    return InvoiceMap.toDomain(invoice);
  }

  async getRecentInvoices(args?: any): Promise<any> {
    const {
      pagination: { limit, offset },
      filtering: filters
    } = args;
    const { db } = this;

    const getModel = () =>
      db(TABLES.INVOICES).whereNot(`${TABLES.INVOICES}.deleted`, 1);

    const totalCount = await filtered(getModel(), filters).count(
      `${TABLES.INVOICES}.id`
    );
    // const draftCount = await filtered(
    //   getModel(),
    //   getModel().whereIn(`${TABLES.INVOICES}.status`, ['DRAFT'])
    // ).count(`${TABLES.INVOICES}.id`);

    // console.info(
    //   'limit = %s, offset = %s, totalCount = %s',
    //   limit,
    //   offset,
    //   totalCount[0]
    // );
    const invoices = await filtered(getModel(), filters)
      .orderBy(`${TABLES.INVOICES}.dateCreated`, 'desc')
      .offset(offset * limit)
      .limit(limit)
      .select();

    //  console.info(invoices);
    // console.info(invoices.map(i => InvoiceMap.toDomain(i)));

    return {
      totalCount: totalCount[0]['count'],
      // draftCount: draftCount[0]['count'],
      invoices: invoices.map(i => InvoiceMap.toDomain(i))
    };
  }

  async getInvoicesByTransactionId(
    transactionId: TransactionId
  ): Promise<Invoice[]> {
    const { db } = this;
    const invoices = await db(TABLES.INVOICES)
      .select()
      .where('transactionId', transactionId.id.toString());

    return invoices.map(i => InvoiceMap.toDomain(i));
  }

  async assignInvoiceNumber(invoiceId: InvoiceId): Promise<Invoice> {
    const { db } = this;

    const invoice = await this.getInvoiceById(invoiceId);
    if (invoice.invoiceNumber) {
      console.log('Invoice number already set');
      return invoice;
    }

    const currentYear = new Date().getFullYear();

    const updated = await db(TABLES.INVOICES)
      .where({ id: invoiceId.id.toString() })
      .update({ dateAccepted: new Date() })
      .update({
        invoiceNumber: db.raw(
          `coalesce((select max("invoiceNumber") + 1 as max from (
          select max("invoiceNumber") as "invoiceNumber" from invoices where "dateAccepted" BETWEEN ? AND ?
            union
            select "invoiceReferenceNumber" as "invoiceNumber" from configurations
          ) referenceNumbers), 1)
        `,
          [`${currentYear}-01-01`, `${currentYear}-12-31`]
        )
      });

    if (!updated) {
      throw RepoError.createEntityNotFoundError(
        'invoice',
        invoiceId.id.toString()
      );
    }

    return this.getInvoiceById(invoiceId);
  }

  async getInvoicePaymentInfo(
    invoiceId: InvoiceId
  ): Promise<InvoicePaymentInfo> {
    const result = await this.db
      .select(
        'invoices.id as invoiceId',
        'invoices.transactionId as transactionId',
        'invoices.status as invoiceStatus',
        'invoices.invoiceNumber as invoiceNumber',
        'invoices.dateIssued as invoiceIssueDate',
        'payers.email as payerEmail',
        'payers.name as payerName',
        'payers.type as payerType',
        'payers.vatId as vatRegistrationNumber',
        'addressLine1 as address',
        'city',
        'country',
        'payments.foreignPaymentId as foreignPaymentId',
        'payments.amount as amount',
        'payments.datePaid as paymentDate',
        'payment_methods.name as paymentType'
      )
      .from('invoices')
      .join('payers', 'payers.invoiceId', '=', 'invoices.id')
      .join('addresses', 'payers.billingAddressId', '=', 'addresses.id')
      .join('payments', 'payments.invoiceId', '=', 'invoices.id')
      .join(
        'payment_methods',
        'payment_methods.id',
        '=',
        'payments.paymentMethodId'
      )
      .where({ 'invoices.id': invoiceId.id.toString() });

    if (result.length === 0) {
      throw RepoError.createEntityNotFoundError(
        'invoice',
        invoiceId.id.toString()
      );
    }

    return result[0];
  }

  async getFailedErpInvoices(): Promise<Invoice[]> {
    const { db } = this;

    const invoices = await db(TABLES.INVOICES)
      .select()
      .whereNot(`deleted`, 1)
      .where({
        status: 'ACTIVE'
      })
      .whereNull('erpReference');

    return invoices.map(i => InvoiceMap.toDomain(i));
  }

  async delete(invoice: Invoice): Promise<unknown> {
    const { db } = this;

    const deletedRows = await db(TABLES.INVOICES)
      .where('id', invoice.id.toString())
      .update({ ...InvoiceMap.toPersistence(invoice), deleted: 1 });

    if (!deletedRows) {
      throw RepoError.createEntityNotFoundError(
        'invoice',
        invoice.id.toString()
      );
    }

    return deletedRows;
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const { db } = this;
    const updateObject = InvoiceMap.toPersistence(invoice);
    const updated = await db(TABLES.INVOICES)
      .where({ id: invoice.invoiceId.id.toString() })
      .update(updateObject);

    if (!updated) {
      throw RepoError.createEntityNotFoundError(
        'invoice',
        invoice.id.toString()
      );
    }

    return invoice;
  }

  async exists(invoice: Invoice): Promise<boolean> {
    try {
      await this.getInvoiceById(invoice.invoiceId);
    } catch (e) {
      if (e.code === RepoErrorCode.ENTITY_NOT_FOUND) {
        return false;
      }

      throw e;
    }

    return true;
  }

  async save(invoice: Invoice): Promise<Invoice> {
    const { db } = this;

    const rawInvoice = InvoiceMap.toPersistence(invoice);

    try {
      await db(TABLES.INVOICES).insert(rawInvoice);
    } catch (e) {
      throw RepoError.fromDBError(e);
    }

    return this.getInvoiceById(invoice.invoiceId);
  }
}
