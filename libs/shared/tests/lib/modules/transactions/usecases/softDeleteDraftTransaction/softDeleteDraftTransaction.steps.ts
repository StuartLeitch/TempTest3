import { expect } from 'chai';
import { Given, When, Then } from 'cucumber';

import { Roles } from '../../../../../../src/lib/modules/users/domain/enums/Roles';

import { Invoice } from '../../../../../../src/lib/modules/invoices/domain/Invoice';
import { InvoiceItem } from '../../../../../../src/lib/modules/invoices/domain/InvoiceItem';
import { InvoiceStatus } from '../../../../../../src/lib/modules/invoices/domain/Invoice';
import { InvoiceMap } from '../../../../../../src/lib/modules/invoices/mappers/InvoiceMap';
import { InvoiceItemMap } from '../../../../../../src/lib/modules/invoices/mappers/InvoiceItemMap';
import { Manuscript } from '../../../../../../src/lib/modules/manuscripts/domain/Manuscript';
import { SoftDeleteDraftTransactionUsecase } from '../../../../../../src/lib/modules/transactions/usecases/softDeleteDraftTransaction/softDeleteDraftTransaction';
import { DeleteTransactionContext } from '../../../../../../src/lib/modules/transactions/usecases/deleteTransaction/deleteTransaction';
import {
  Transaction,
  TransactionStatus,
} from '../../../../../../src/lib/modules/transactions/domain/Transaction';
import { TransactionMap } from '../../../../../../src/lib/modules/transactions/mappers/TransactionMap';
import { MockTransactionRepo } from '../../../../../../src/lib/modules/transactions/repos/mocks/mockTransactionRepo';

import { MockInvoiceRepo } from '../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceRepo';
import { MockInvoiceItemRepo } from '../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceItemRepo';
import { ArticleRepoContract } from '../../../../../../src/lib/modules/manuscripts/repos/articleRepo';
import { MockArticleRepo } from '../../../../../../src/lib/modules/manuscripts/repos/mocks/mockArticleRepo';
import { ArticleMap } from '../../../../../../src/lib/modules/manuscripts/mappers/ArticleMap';

const defaultContext: DeleteTransactionContext = { roles: [Roles.SUPER_ADMIN] };

const mockTransactionRepo: MockTransactionRepo = new MockTransactionRepo();
const mockInvoiceRepo: MockInvoiceRepo = new MockInvoiceRepo();
const mockInvoiceItemRepo: MockInvoiceItemRepo = new MockInvoiceItemRepo();
const mockArticleRepo: ArticleRepoContract = new MockArticleRepo();

const usecase: SoftDeleteDraftTransactionUsecase = new SoftDeleteDraftTransactionUsecase(
  mockTransactionRepo,
  mockInvoiceItemRepo,
  mockInvoiceRepo,
  mockArticleRepo
);

let manuscriptId;
let journalId;

let result: any;
let transaction: Transaction;
let invoice: Invoice;
let invoiceItem: InvoiceItem;
let manuscript: Manuscript;

Given(/^A journal "([\w-]+)" with a manuscript "([\w-]+)"$/, async function (
  journalTestId: string,
  manuscriptTestId: string
) {
  journalId = journalTestId;
  manuscriptId = manuscriptTestId;

  manuscript = ArticleMap.toDomain({
    id: manuscriptId,
    journalId: journalId,
  });

  mockArticleRepo.save(manuscript);
});

Given(
  /^A Invoice with a DRAFT Transaction and a Invoice Item tied to the manuscript "([\w-]+)"$/,
  async function (manuscriptTestId: string) {
    transaction = TransactionMap.toDomain({
      status: TransactionStatus.DRAFT,
    });

    invoice = InvoiceMap.toDomain({
      status: InvoiceStatus.DRAFT,
      transactionId: transaction.transactionId.id.toString(),
    });
    invoiceItem = InvoiceItemMap.toDomain({
      manuscriptId: manuscriptTestId,
      invoiceId: invoice.invoiceId.id.toString(),
    });

    invoice.addInvoiceItem(invoiceItem);
    transaction.addInvoice(invoice);

    mockTransactionRepo.save(transaction);
    mockInvoiceRepo.save(invoice);
    mockInvoiceItemRepo.save(invoiceItem);
  }
);

When(
  /^SoftDeleteDraftTransactionUsecase is executed for manuscript "([\w-]+)"$/,
  async (manuscriptTestId: string) => {
    result = await usecase.execute(
      {
        manuscriptId: manuscriptTestId,
      },
      defaultContext
    );
  }
);

Then(
  'The DRAFT Transaction associated with the manuscript should be soft deleted',
  async () => {
    expect(result.value.isSuccess).to.equal(true);

    const transactions = await mockTransactionRepo.getTransactionCollection();
    expect(transactions.length).to.equal(0);
  }
);

Then(
  'The DRAFT Invoice associated with the manuscript should be soft deleted',
  async () => {
    const invoices = await mockInvoiceRepo.getInvoiceCollection();
    expect(invoices.length).to.equal(0);
  }
);

Then(
  'The Invoice Item associated with the manuscript should be soft deleted',
  async () => {
    const invoiceItems = await mockInvoiceItemRepo.getInvoiceItemCollection();
    expect(invoiceItems.length).to.equal(0);
  }
);
