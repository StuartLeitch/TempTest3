/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @nrwl/nx/enforce-module-boundaries */

import { Connection } from 'jsforce';
import {
  ErpInvoiceRequest,
  ErpServiceContract,
  PayerType,
  InvoiceItem,
  ErpInvoiceResponse,
  ErpRevRecRequest,
  Invoice,
  PublisherCustomValues,
  ErpRevRecResponse,
} from '@hindawi/shared';
import countryList from 'country-list';
import { Manuscript } from 'libs/shared/src/lib/modules/manuscripts/domain/Manuscript';

interface ErpFixedValues {
  tradeDocumentType: string;
  currencyId: string;
  companyId: string;
  taxTreatment: string;
  journalType: string;
  productDimension: string;
}

export const defaultErpFixedValues: ErpFixedValues = {
  tradeDocumentType: 'a650Y000000boz4QAA',
  currencyId: 'a5W0Y000000GnlcUAC',
  companyId: 'a5T0Y000000TR3pUAG',
  taxTreatment: 'a6B0Y000000fyP2UAI',
  journalType: 'a4n0Y000000HGqQQAW',
  productDimension: 'a4V0Y0000001chNUAQ',
};

export class SageService implements ErpServiceContract {
  private connection: Connection;

  constructor(
    private readonly logger: any,
    private config: any,
    readonly referenceMappings?: unknown,
    private fixedValues: ErpFixedValues = defaultErpFixedValues
  ) {}

  get vendorName(): string {
    return 'sage';
  }

  get invoiceErpRefFieldName(): string {
    return 'erp';
  }

  get invoiceRevenueRecRefFieldName(): string {
    return 'revenueRecognition';
  }

  private async getConnection(): Promise<Connection> {
    const { user, password, securityToken, loginUrl } = this.config;

    if (!this.connection) {
      this.connection = new Connection({
        loginUrl,
      });

      try {
        // tslint:disable-next-line: no-unused-expression
        // this.connection.authorize;
        await this.connection.login(user, password + securityToken);
        // TODO: Log this message in the banner
        console.log('ERP login successful');
        return this.connection;
      } catch (err) {
        this.connection = null;
        throw err;
      }
    }

    return this.connection;
  }

  async registerInvoice(data: ErpInvoiceRequest): Promise<ErpInvoiceResponse> {
    const { items, tradeDocumentItemProduct } = data;

    const accountId = await this.registerPayer(data);
    const tradeDocumentId = await this.registerTradeDocument(accountId, data);

    const tradeItemIds = await Promise.all(
      items.map(async (item) =>
        this.registerInvoiceItem(
          tradeDocumentId,
          data,
          item,
          tradeDocumentItemProduct
        )
      )
    );

    if (this.connection) {
      await this.connection.logout(() => console.log('ERP logout.'));
      this.connection = null;
    }

    return {
      accountId,
      tradeDocumentId,
      tradeItemIds,
    };
  }

  public async registerRevenueRecognition(
    data: ErpRevRecRequest
  ): Promise<ErpRevRecResponse> {
    const journal = await this.registerJournal(data);

    if (journal == null) {
      return null;
    }

    const journalItem = await this.registerJournalItem({
      journal,
      ...data,
    });
    const journalTags = await this.registerJournalTags({ journal, ...data });
    const journalItemTag = await this.registerJournalItemTag({
      journalItem,
      ...data,
    });

    if (this.connection) {
      await this.connection.logout(() => console.log('ERP logout.'));
      this.connection = null;
    }

    return {
      journal,
      journalItem,
      journalTags,
      journalItemTag,
    };
  }

  private async registerPayer(
    data: Partial<ErpInvoiceRequest>
  ): Promise<string> {
    this.logger.info('Register payer');
    const connection = await this.getConnection();

    if (!connection) {
      throw new Error('Failed login. No connection to ERP service.');
    }

    const { manuscript, payer, billingAddress } = data;

    let name =
      payer.type === PayerType.INDIVIDUAL
        ? payer.name.value
        : payer.organization.value;
    name = name.slice(0, 70);
    name += ` ${manuscript.customId}`;

    const accountData = {
      Name: name,
      AccountNumber: manuscript.customId,
      // BillingAddress:{Street: billingAddress.addressLine1},
      s2cor__Country_Code__c: billingAddress.country,
      s2cor__Registration_Number_Type__c: 'VAT Registration Number',
      s2cor__VAT_Registration_Number__c: payer.VATId,
    };

    let existingAccount;
    try {
      existingAccount = await connection
        .sobject('Account')
        .select({ id: true })
        .where({ Name: name })
        .execute();
    } catch (err) {
      console.error(err);
    }

    let account;
    if (existingAccount.length) {
      account = existingAccount[0];
      account.id = account.Id || account.id;
      console.log('Account object reused: ', account.id);
    } else {
      account = await connection.sobject('Account').create(accountData);
      if (!account.success) {
        throw account;
      }
      console.log('Account object registered: ', account.id);
    }

    const payerEmail = payer.email.value;

    const names = name.split(' ');
    const firstName = names[0];
    names.shift();
    const lastName = names.join(' ') || '---';

    const existingContact = await connection
      .sobject('Contact')
      .select({ Id: true })
      .where({
        Email: payerEmail,
      })
      .execute();

    if (existingContact.length) {
      console.log('Contact object reused: ', (existingContact[0] as any).Id);
      return account.id;
    }

    const contact = await connection.sobject('Contact').create({
      AccountId: account.id,
      Email: payerEmail,
      FirstName: firstName,
      LastName: lastName,
    });

    if (!contact.success) {
      throw contact;
    }

    console.log('Contact object registered: ', contact.id);

    return account.id;
  }

  private async registerTradeDocument(
    accountId: string,
    data: Partial<ErpInvoiceRequest>
  ): Promise<string> {
    this.logger.info('Register TradeDocument');
    const connection = await this.getConnection();

    if (!connection) {
      console.log('Failed login. No connection to ERP service.');
      return;
    }

    const {
      invoice,
      manuscript,
      items,
      billingAddress,
      journalName,
      vatNote,
      exchangeRate,
    } = data;
    const invoiceDate = invoice.dateIssued;
    const fixedValues = this.fixedValues;
    let referenceNumber;

    if (invoice.invoiceNumber && invoice.dateAccepted) {
      referenceNumber = invoice.referenceNumber;
    }

    const description = `${journalName} - Article Processing Charges for article ${manuscript.customId}`;
    const tradeDocumentObject = {
      s2cor__Account__c: accountId,
      s2cor__Approval_Status__c: 'Approved',
      s2cor__Company__c: fixedValues.companyId,
      s2cor__Currency__c: fixedValues.currencyId,
      s2cor__Date__c: invoiceDate,
      s2cor__Posting_Date__c: invoiceDate,
      s2cor__Operation_Date__c: invoiceDate,
      s2cor__Manual_Due_Date__c: invoiceDate,
      s2cor__Reference__c: referenceNumber,
      s2cor__Status__c: 'Unsubmitted',
      s2cor__Trade_Document_Type__c: fixedValues.tradeDocumentType,
      s2cor__Legal_Note__c: this.getVatNote(vatNote, items, exchangeRate),
      s2cor__BillingCountry__c: countryList.getName(billingAddress.country),
      s2cor__BillingCity__c: billingAddress.city,
      s2cor__BillingStreet__c: billingAddress?.addressLine1
        ? billingAddress?.addressLine1.substr(0, 255)
        : '',
      s2cor__Description__c: description,
    };

    const existingTradeDocument = await connection
      .sobject('s2cor__Sage_INV_Trade_Document__c')
      .find({
        s2cor__Reference__c: referenceNumber,
        s2cor__Account__c: accountId,
      })
      .execute();

    if (existingTradeDocument.length) {
      const id = (existingTradeDocument[0] as any).Id;
      console.log('Reusing trade document', id);
      return id;
    }
    const tradeDocument = await connection
      .sobject('s2cor__Sage_INV_Trade_Document__c')
      .create(tradeDocumentObject);

    if (!tradeDocument.success) {
      throw tradeDocument;
    }

    console.info('Trade Document registered: ', tradeDocument.id);

    return tradeDocument.id;
  }

  /**
   * Only allows one item currently
   * @param tradeDocumentId
   * @param data
   * @param invoiceItem
   */
  private async registerInvoiceItem(
    tradeDocumentId: string,
    data: Partial<ErpInvoiceRequest>,
    invoiceItem: InvoiceItem,
    product: string
  ): Promise<string> {
    const connection = await this.getConnection();
    const { journalName, manuscript, vatNote } = data;
    const discountAmount = invoiceItem.price - invoiceItem.calculateNetPrice();
    const description =
      invoiceItem.type === 'APC'
        ? `${journalName} - Article Processing Charges for article ${manuscript.customId}`
        : `${journalName} - Article Reprint Charges for article ${manuscript.customId}`;
    const tdObj = {
      s2cor__Trade_Document__c: tradeDocumentId,
      s2cor__Description__c: description,
      s2cor__Quantity__c: '1',
      s2cor__Tax_Code__c: this.getTaxCode(vatNote),
      s2cor__Tax_Treatment__c: this.getTaxTreatment(vatNote),
      s2cor__Unit_Price__c: invoiceItem.price,
      s2cor__Product__c: product, //'01t0Y000002BuB9QAK', // TODO to be determined based on journal ownership
      s2cor__Discount_Type__c: 'Amount',
      s2cor__Discount_Amount__c: discountAmount,
      s2cor__Discount_Value__c: discountAmount,
      s2cor__Tax_Amount__c:
        (invoiceItem.vat / 100) * invoiceItem.calculateNetPrice(),
      s2cor__Tax_Rates__c: invoiceItem.vat.toString(),
    };

    const existingTradeItems = await connection
      .sobject('s2cor__Sage_INV_Trade_Document_Item__c')
      .find({ s2cor__Trade_Document__c: tradeDocumentId });

    if (existingTradeItems.length) {
      const invoiceItemsToDelete = existingTradeItems.map(
        (ii) => (ii as any).Id
      );

      // console.log('Deleting invoice items: ', invoiceItemsToDelete);

      const deleteResponses = await connection
        .sobject('s2cor__Sage_INV_Trade_Document_Item__c')
        .delete(invoiceItemsToDelete);

      for (const deleteResponse of deleteResponses) {
        if (!deleteResponse.success) {
          throw deleteResponse;
        }
      }
    }

    const tradeItem = await connection
      .sobject('s2cor__Sage_INV_Trade_Document_Item__c')
      .create(tdObj);

    if (!tradeItem.success) {
      throw tradeItem;
    }

    console.log('Trade Document Item: ', tradeItem.id);

    return tradeItem.id;
  }

  private getTaxCode(vatNote: any): string {
    return vatNote.tax.type.value;
  }

  private getTaxTreatment(vatNote: any): string {
    return vatNote.tax.treatment.value;
  }

  private getVatNote(
    vatNote: any,
    invoiceItems: InvoiceItem[],
    exchangeRate: number
  ): string {
    const { template } = vatNote;
    return template
      .replace(
        '{Vat/Rate}',
        `${(
          invoiceItems.reduce(
            (acc, curr) => acc + (curr.vat / 100) * curr.calculateNetPrice(),
            0
          ) / exchangeRate
        ).toFixed(2)}`
      )
      .replace('{Rate}', exchangeRate);
  }

  private async registerJournal(data: {
    invoice: Invoice;
    manuscript: Manuscript;
    publisherCustomValues: PublisherCustomValues;
  }) {
    // console.info(`registerJournal init with`, data);

    const connection = await this.getConnection();

    if (!connection) {
      console.log('Failed login. No connection to ERP service.');
      return;
    }

    const {
      fixedValues: { currencyId, companyId, taxTreatment, journalType },
    } = this;
    const { invoice, manuscript, publisherCustomValues } = data;

    const existingJournalTags = await connection
      .sobject('s2cor__Sage_ACC_Tag__c')
      .select({ Id: true })
      .where({ Name: invoice.referenceNumber, s2cor__Company__c: companyId })
      .execute();
    // this.logger.info('Existing Tags by Invoice Number: ', existingJournalTags);

    if (existingJournalTags.length === 0) {
      return null;
    }

    const journalReference = `${publisherCustomValues.journalReference} ${manuscript.customId} ${invoice.referenceNumber}`;
    const journalData = {
      name: `Article ${manuscript.customId} - Invoice ${invoice.referenceNumber}`,
      s2cor__Reference__c: journalReference,
      s2cor__Approval_Status__c: 'Unposted',
      s2cor__Date__c: manuscript.datePublished,
      s2cor__Create_Tags__c: false,
      s2cor__Company__c: companyId,
      s2cor__Default_Tax_Treatment__c: taxTreatment,
      s2cor__Currency__c: currencyId,
      s2cor__Journal_Type__c: journalType,
    };
    // this.logger.info('journalData', journalData);

    const existingJournal = await connection
      .sobject('s2cor__Sage_ACC_Journal__c')
      .select({ Id: true })
      .where({ Name: journalData.name })
      .execute();
    this.logger.info('Existing Journal: ', existingJournal);

    let journal: any;
    if (existingJournal.length) {
      journal = existingJournal[0];
      journal.id = journal.Id || journal.id;
      this.logger.info('Journal object reused', journal);
    } else {
      journal = await connection
        .sobject('s2cor__Sage_ACC_Journal__c')
        .create(journalData);
      this.logger.info('Journal creation:', journal);
      if (!journal.success) {
        throw journal;
      }
      this.logger.info('Journal object registered: ', journal);
    }

    return journal;
  }

  private async registerJournalItem(data: {
    journal: any;
    manuscript: Manuscript;
    invoice: Invoice;
    invoiceTotal: number;
    publisherCustomValues: PublisherCustomValues;
  }) {
    // this.logger.info(`registerJournalItem init with`, data);

    const connection = await this.getConnection();

    if (!connection) {
      console.log('Failed login. No connection to ERP service.');
      return;
    }

    const {
      journal,
      manuscript,
      invoice,
      invoiceTotal,
      publisherCustomValues,
    } = data;
    const {
      fixedValues: { journalType },
    } = this;

    const journalItemData = {
      Name: `Article ${manuscript.customId} - Invoice ${invoice.referenceNumber}`,
      s2cor__Journal__c: journal.id,
      s2cor__Reference__c: `${publisherCustomValues.journalItemReference} ${manuscript.customId} ${invoice.referenceNumber}`,
      s2cor__Journal_Type__c: journalType,
      s2cor__Amount__c: invoiceTotal,
      s2cor__Date__c: manuscript.datePublished,
      s2cor__Approval_Status__c: 'Unposted',
      s2cor__Status__c: 'Submitted',
    };
    // this.logger.info('Journal Item Data: ', journalItemData);

    const existingJournalItem = await connection
      .sobject('s2cor__Sage_ACC_Journal_Item__c')
      .select({ Id: true })
      .where({ Name: journalItemData.Name })
      .execute();
    // this.logger.info('Existing Journal Item: ', existingJournalItem);

    let journalItem: any;
    if (existingJournalItem.length) {
      journalItem = existingJournalItem[0];
      journalItem.id = journalItem.Id || journalItem.id;
      // this.logger.info('Journal Item object reused: ', journalItem);
    } else {
      journalItem = await connection
        .sobject('s2cor__Sage_ACC_Journal_Item__c')
        .create(journalItemData);
      if (!journalItem.success) {
        throw journalItem;
      }
      // this.logger.info('Journal Item object registered: ', journalItem);
    }

    return journalItem;
  }

  private async registerJournalTags(data: {
    journal: any;
    invoice: Invoice;
    publisherCustomValues: PublisherCustomValues;
  }) {
    // this.logger.info(`registerJournalTags init with`, data);

    const connection = await this.getConnection();

    if (!connection) {
      console.log('Failed login. No connection to ERP service.');
      return;
    }

    const {
      fixedValues: { companyId, productDimension },
    } = this;
    const { invoice, journal, publisherCustomValues } = data;

    const journalTags = [];
    const dimensions = {
      RevenueRecognitionType: 'a4V0Y0000001chdUAA',
      SalesInvoiceNumber: 'a4V0Y0000001chSUAQ',
      Product: productDimension,
    };
    // this.logger.info('Dimensions: ', dimensions);

    const existingJournalTags = await connection
      .sobject('s2cor__Sage_ACC_Tag__c')
      .select({ Id: true, Name: true })
      .where({ Name: invoice.referenceNumber, s2cor__Company__c: companyId })
      .execute();
    // this.logger.info('Existing Journal Tags: ', existingJournalTags);

    const journalTagData = {
      s2cor__Journal__c: journal.id,
      s2cor__Dimension__c: dimensions.RevenueRecognitionType,
      s2cor__Tag__c: publisherCustomValues.journalTag,
    };
    // this.logger.info('Journal Tag Data: ', journalTagData);

    let journalTag: any;
    journalTag = await connection
      .sobject('s2cor__Sage_ACC_Journal_Tag__c')
      .create(journalTagData);
    // this.logger.info('Journal Tag: ', journalTag);

    if (!journalTag.success) {
      throw journalTag;
    }
    // this.logger.info(
    //   `Journal Tag #1 for ${dimensions.RevenueRecognitionType} object registered`,
    //   journalTag
    // );
    journalTags.push(journalTag);
    // this.logger.info(`Journal Tags #1`, journalTags);

    journalTagData.s2cor__Tag__c = (existingJournalTags[0] as any).Id;
    journalTagData.s2cor__Dimension__c = dimensions.SalesInvoiceNumber;
    journalTag = await connection
      .sobject('s2cor__Sage_ACC_Journal_Tag__c')
      .create(journalTagData);
    // this.logger.info(
    //   `Journal Tag for ${dimensions.SalesInvoiceNumber} object registered`,
    //   journalTag
    // );
    journalTags.push(journalTag);

    // this.logger.info(`Journal Tags #2`, journalTags);

    return journalTags;
  }

  private async registerJournalItemTag(data: {
    journalItem: any;
    publisherCustomValues: PublisherCustomValues;
  }) {
    // this.logger.info(`registerJournalItemTag init with`, data);

    const connection = await this.getConnection();

    if (!connection) {
      console.log('Failed login. No connection to ERP service.');
      return;
    }

    const { journalItem, publisherCustomValues } = data;
    const {
      fixedValues: { productDimension },
    } = this;

    const journalItemTagData = {
      s2cor__Journal_Item__c: journalItem.id,
      s2cor__Dimension__c: productDimension,
      s2cor__Tag__c: publisherCustomValues.journalItemTag,
    };
    // this.logger.info(`Journal Item Tag Data`, journalItemTagData);

    const existingJournalItemTag = await connection
      .sobject('s2cor__Sage_ACC_Journal_Item_Tag__c')
      .select({ Id: true })
      .where({
        s2cor__Journal_Item__c: journalItem.id,
        s2cor__Dimension__c: productDimension,
      })
      .execute();

    // console.info(existingJournalItemTag);
    // this.logger.info('Existing Journal Item Tag: ', existingJournalItemTag);

    let journalItemTag: any;
    if (existingJournalItemTag.length) {
      const _journalItemTag: any = existingJournalItemTag[0];
      // _journalItemTag.id = _journalItemTag.Id || _journalItemTag.id;
      // journalItemTag = _journalItemTag;
      _journalItemTag.s2cor__Tag__c = publisherCustomValues.journalItemTag;
      journalItemTag = await connection
        .sobject('s2cor__Sage_ACC_Journal_Item_Tag__c')
        .update(_journalItemTag);
      this.logger.info('Journal Item Tag object updated: ', journalItemTag);
    } else {
      journalItemTag = await connection
        .sobject('s2cor__Sage_ACC_Journal_Item_Tag__c')
        .create(journalItemTagData);
      if (!journalItemTag.success) {
        throw journalItemTag;
      }
      this.logger.info('Journal Item Tag object registered: ', journalItemTag);
    }

    return journalItemTag;
  }
}
