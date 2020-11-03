/* eslint-disable @nrwl/nx/enforce-module-boundaries */

import { Before, Given, When, Then, After } from 'cucumber';
import { expect } from 'chai';

import { SubmissionSubmitted } from '@hindawi/phenom-events';

import { UsecaseAuthorizationContext } from '../../../../../libs/shared/src/lib/domain/authorization';

import { Manuscript } from '../../../../../libs/shared/src/lib/modules/manuscripts/domain/Manuscript';
import { Roles } from '../../../../../libs/shared/src/lib/modules/users/domain/enums/Roles';

import { MockPausedReminderRepo } from '../../../../../libs/shared/src/lib/modules/notifications/repos/mocks/mockPausedReminderRepo';
import { MockTransactionRepo } from '../../../../../libs/shared/src/lib/modules/transactions/repos/mocks/mockTransactionRepo';
import { MockInvoiceItemRepo } from '../../../../../libs/shared/src/lib/modules/invoices/repos/mocks/mockInvoiceItemRepo';
import { MockArticleRepo } from '../../../../../libs/shared/src/lib/modules/manuscripts/repos/mocks/mockArticleRepo';
import { MockCatalogRepo } from '../../../../../libs/shared/src/lib/modules/journals/repos/mocks/mockCatalogRepo';
import { MockInvoiceRepo } from '../../../../../libs/shared/src/lib/modules/invoices/repos/mocks/mockInvoiceRepo';
import { MockCouponRepo } from '../../../../../libs/shared/src/lib/modules/coupons/repos/mocks/mockCouponRepo';
import { MockWaiverRepo } from '../../../../../libs/shared/src/lib/modules/waivers/repos/mocks/mockWaiverRepo';
import { MockLogger } from '../../../../../libs/shared/src/lib/infrastructure/logging/mocks/MockLogger';

import { ManuscriptMap } from '../../../../../libs/shared/src/lib/modules/manuscripts/mappers/ManuscriptMap';
import { ArticleMap } from '../../../../../libs/shared/src/lib/modules/manuscripts/mappers/ArticleMap';
import { CatalogMap } from '../../../../../libs/shared/src/lib/modules/journals/mappers/CatalogMap';

import { GetInvoiceIdByManuscriptCustomIdUsecase } from '../../../../../libs/shared/src/lib/modules/invoices/usecases/getInvoiceIdByManuscriptCustomId/getInvoiceIdByManuscriptCustomId';
import { GetItemsForInvoiceUsecase } from '../../../../../libs/shared/src/lib/modules/invoices/usecases/getItemsForInvoice/getItemsForInvoice';
import { GetInvoiceDetailsUsecase } from '../../../../../libs/shared/src/lib/modules/invoices/usecases/getInvoiceDetails';

import { Context } from '../../../src/builders';

import { SubmissionSubmittedHandler as Handler } from '../../../src/queue_service/handlers/SubmissionSubmitted';

interface MockContext {
  repos: {
    pausedReminder: MockPausedReminderRepo;
    invoiceItem: MockInvoiceItemRepo;
    transaction: MockTransactionRepo;
    manuscript: MockArticleRepo;
    catalog: MockCatalogRepo;
    invoice: MockInvoiceRepo;
    coupon: MockCouponRepo;
    waiver: MockWaiverRepo;
  };
  services: {
    logger: MockLogger;
  };
}

let context: MockContext = {
  repos: {
    pausedReminder: null,
    invoiceItem: null,
    transaction: null,
    manuscript: null,
    catalog: null,
    invoice: null,
    coupon: null,
    waiver: null,
  },
  services: {
    logger: null,
  },
};

const defaultUsecaseContext: UsecaseAuthorizationContext = {
  roles: [Roles.SUPER_ADMIN],
};

let submittingManuscript: Manuscript = null;
let event: SubmissionSubmitted = null;

Before(() => {
  context.repos.pausedReminder = new MockPausedReminderRepo();
  context.repos.invoiceItem = new MockInvoiceItemRepo();
  context.repos.transaction = new MockTransactionRepo();
  context.repos.manuscript = new MockArticleRepo();
  context.repos.catalog = new MockCatalogRepo();
  context.repos.invoice = new MockInvoiceRepo();
  context.repos.coupon = new MockCouponRepo();
  context.repos.waiver = new MockWaiverRepo();

  context.services.logger = new MockLogger();

  submittingManuscript = null;
  event = null;
});

After(() => {
  context = {
    repos: {
      pausedReminder: null,
      invoiceItem: null,
      transaction: null,
      manuscript: null,
      catalog: null,
      invoice: null,
      coupon: null,
      waiver: null,
    },
    services: {
      logger: null,
    },
  };
});

Given(
  /^There is a Journal "([\w-]+)" with APC "([\d]+)"$/,
  async (journalId: string, apc: string) => {
    const journal = CatalogMap.toDomain({
      journalId,
      journalTitle: journalId,
      id: journalId,
      type: 'mock',
      amount: Number.parseFloat(apc),
    });

    context.repos.catalog.addMockItem(journal);
  }
);

Given(
  /^A "([\w\s]+)" with CustomId "([\w\d]+)" is submitted on journal "([\w-]+)"$/,
  async (articleType: string, customId: string, journalId: string) => {
    submittingManuscript = ManuscriptMap.toDomain({
      articleType,
      journalId,
      customId,
    });
  }
);

When(`The "Submission Submitted" event is triggered`, async () => {
  event = {
    submissionId: submittingManuscript.customId,
    manuscripts: [
      {
        journalId: submittingManuscript.journalId,
        articleType: { name: submittingManuscript.articleType },
        customId: submittingManuscript.customId,
        authors: [
          {
            email: submittingManuscript.authorEmail,
            isCorresponding: true,
          },
        ],
      },
    ],
  } as SubmissionSubmitted;
  await Handler.handler((context as unknown) as Context)(event);
});

Then(
  /^The invoice for CustomId "([\w\d]+)" is created$/,
  async (customId: string) => {
    const invoiceIdUsecase = new GetInvoiceIdByManuscriptCustomIdUsecase(
      context.repos.manuscript,
      context.repos.invoiceItem
    );

    const maybeInvoiceId = await invoiceIdUsecase.execute(
      { customId },
      defaultUsecaseContext
    );

    expect(maybeInvoiceId.isRight()).to.be.true;
    expect(maybeInvoiceId.value.getValue()).to.be.ok;
  }
);

Then(
  /^The invoice for CustomId "([\w\d]+)" has price "([\d]+)"$/,
  async (customId: string, price: string) => {
    const invoiceIdUsecase = new GetInvoiceIdByManuscriptCustomIdUsecase(
      context.repos.manuscript,
      context.repos.invoiceItem
    );
    const invoiceUsecase = new GetInvoiceDetailsUsecase(context.repos.invoice);
    const invoiceItemsUsecase = new GetItemsForInvoiceUsecase(
      context.repos.invoiceItem,
      context.repos.coupon,
      context.repos.waiver
    );

    const maybeInvoiceId = await invoiceIdUsecase.execute(
      { customId },
      defaultUsecaseContext
    );

    expect(maybeInvoiceId.isRight()).to.be.true;
    if (maybeInvoiceId.isLeft()) {
      throw maybeInvoiceId.value;
    }

    const invoiceId = maybeInvoiceId.value.getValue()[0].id.toString();

    const maybeInvoice = await invoiceUsecase.execute(
      { invoiceId },
      defaultUsecaseContext
    );

    expect(maybeInvoice.isRight()).to.be.true;
    if (maybeInvoice.isLeft()) {
      throw maybeInvoice.value;
    }

    const invoice = maybeInvoice.value.getValue();

    const maybeInvoiceItems = await invoiceItemsUsecase.execute(
      { invoiceId },
      defaultUsecaseContext
    );
    expect(maybeInvoiceItems.isRight()).to.be.true;
    if (maybeInvoiceItems.isLeft()) {
      throw maybeInvoiceItems.value;
    }

    invoice.addItems(maybeInvoiceItems.value.getValue());

    expect(invoice.invoiceTotal).to.equal(Number.parseFloat(price));
  }
);

Then(
  /^The invoice for CustomId "([\w\d]+)" is not created$/,
  async (customId: string) => {
    const article = await context.repos.manuscript.findByCustomId(customId);
    expect(article).to.be.null;
  }
);

Given(
  /^A "([\w\s]+)" with CustomId "([\w\d]+)" is on "([\w-]+)"$/,
  async (articleType: string, customId: string, journalId: string) => {
    const article = ArticleMap.toDomain({
      articleType,
      journalId,
      customId,
    });

    event = {
      submissionId: customId,
      manuscripts: [
        {
          journalId: article.journalId,
          articleType: { name: article.articleType },
          customId: article.customId,
          authors: [
            {
              email: article.authorEmail,
              isCorresponding: true,
            },
          ],
        },
      ],
    } as SubmissionSubmitted;
    await Handler.handler((context as unknown) as Context)(event);
  }
);
