import { expect } from 'chai';
import { Given, When, Then, Before } from '@cucumber/cucumber';

import { MockLogger } from '../../../../../../src/lib/infrastructure/logging/mocks/MockLogger';
import { SchedulerContract } from '../../../../../../src/lib/infrastructure/scheduler/Scheduler';

import { ResumeInvoiceConfirmationReminderUsecase } from '../../../../../../src/lib/modules/notifications/usecases/resumeInvoiceConfirmationReminders';
import { ResumeInvoiceConfirmationRemindersResponse } from '../../../../../../src/lib/modules/notifications/usecases/resumeInvoiceConfirmationReminders/resumeInvoiceConfirmationRemindersResponse';

import {
  Notification,
  NotificationType,
} from '../../../../../../src/lib/modules/notifications/domain/Notification';
import { NotificationPause } from '../../../../../../src/lib/modules/notifications/domain/NotificationPause';
import { NotificationMap } from '../../../../../../src/lib/modules/notifications/mappers/NotificationMap';
import { MockPausedReminderRepo } from '../../../../../../src/lib/modules/notifications/repos/mocks/mockPausedReminderRepo';
import { MockSentNotificationRepo } from '../../../../../../src/lib/modules/notifications/repos/mocks/mockSentNotificationRepo';
import { MockInvoiceRepo } from '../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceRepo';
import { MockInvoiceItemRepo } from './../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceItemRepo';
import { MockArticleRepo } from './../../../../../../src/lib/modules/manuscripts/repos/mocks/mockArticleRepo';
import { MockErpReferenceRepo } from './../../../../../../src/lib/modules/vendors/repos/mocks/mockErpReferenceRepo';
import { MockTransactionRepo } from './../../../../../../src/lib/modules/transactions/repos/mocks/mockTransactionRepo';
import { MockCatalogRepo } from '../../../../../../src/lib/modules/journals/repos/mocks/mockCatalogRepo';
import { MockPayerRepo } from '../../../../../../src/lib/modules/payers/repos/mocks/mockPayerRepo';
import { PublisherMap } from '../../../../../../src/lib/modules/publishers/mappers/PublisherMap';
import { MockPublisherRepo } from '../../../../../../src/lib/modules/publishers/repos/mocks/mockPublisherRepo';

import {
  ArticleMap,
  CatalogMap,
  InvoiceItemMap,
  MockAddressRepo,
  Roles,
  TransactionMap,
  TransactionStatus,
  UsecaseAuthorizationContext,
} from '../../../../../../src/lib/shared';
import { InvoiceMap } from './../../../../../../src/lib/modules/invoices/mappers/InvoiceMap';
import { InvoiceId } from '../../../../../../src/lib/modules/invoices/domain/InvoiceId';
import { UniqueEntityID } from '../../../../../../src/lib/core/domain/UniqueEntityID';

function makeNotificationData(
  id: string,
  invoiceId: string,
  overwrites?: any
): Notification {
  return NotificationMap.toDomain({
    recipientEmail: 'test-email',
    dateSent: new Date(),
    type: NotificationType.REMINDER_CONFIRMATION,
    id,
    invoiceId,
    ...overwrites,
  });
}

let mockPausedReminderRepo: MockPausedReminderRepo;
let mockSentNotificationRepo: MockSentNotificationRepo;
let mockInvoiceRepo: MockInvoiceRepo;
let mockInvoiceItemRepo: MockInvoiceItemRepo;
let mockArticleRepo: MockArticleRepo;
let mockErpReferenceRepo: MockErpReferenceRepo;
let mockLogger: MockLogger;
let mockTransactionRepo: MockTransactionRepo;
let mockCatalogRepo: MockCatalogRepo;
let mockPublisherRepo: MockPublisherRepo;
let scheduler: SchedulerContract;
let notification: Notification;
let pausedReminder: NotificationPause;
let response: ResumeInvoiceConfirmationRemindersResponse;
let usecase: ResumeInvoiceConfirmationReminderUsecase;

const context: UsecaseAuthorizationContext = {
  roles: [Roles.ADMIN],
};

Before(() => {
  mockPausedReminderRepo = new MockPausedReminderRepo();
  mockSentNotificationRepo = new MockSentNotificationRepo();
  mockArticleRepo = new MockArticleRepo();
  mockErpReferenceRepo = new MockErpReferenceRepo();
  mockLogger = new MockLogger();
  mockInvoiceRepo = new MockInvoiceRepo(
    mockArticleRepo,
    mockInvoiceItemRepo,
    mockErpReferenceRepo
  );
  mockPublisherRepo = new MockPublisherRepo();
  mockCatalogRepo = new MockCatalogRepo();
  mockInvoiceItemRepo = new MockInvoiceItemRepo();
  mockTransactionRepo = new MockTransactionRepo();

  usecase = new ResumeInvoiceConfirmationReminderUsecase(
    mockPausedReminderRepo,
    mockInvoiceItemRepo,
    mockTransactionRepo,
    mockArticleRepo,
    mockInvoiceRepo,
    mockLogger,
    scheduler
  );
});

Given(/^one invoice with id "([\w-]+)"/, async (testInvoiceId: string) => {
  const transaction = TransactionMap.toDomain({
    status: TransactionStatus.ACTIVE,
    deleted: 0,
    dateCreated: new Date(),
    dateUpdated: new Date(),
    id: 'testId',
  });
  const invoice = InvoiceMap.toDomain({
    transactionId: 'testId',
    dateCreated: new Date(),
    id: testInvoiceId,
  });
  const publisher = PublisherMap.toDomain({
    id: 'testingPublisher',
    customValues: {},
  } as any);

  const catalog = CatalogMap.toDomain({
    publisherId: publisher.publisherId.id.toString(),
    isActive: true,
    journalId: 'testingJournal',
  });

  const manuscript = ArticleMap.toDomain({
    customId: '8888',
    journalId: catalog.journalId.id.toValue(),
    datePublished: new Date(),
  });

  const invoiceItem = InvoiceItemMap.toDomain({
    invoiceId: testInvoiceId,
    id: 'invoice-item',
    manuscriptId: manuscript.manuscriptId.id.toValue().toString(),
    price: 100,
    vat: 20,
  });

  mockPublisherRepo.addMockItem(publisher);
  mockCatalogRepo.addMockItem(catalog);
  mockArticleRepo.addMockItem(manuscript);
  mockInvoiceItemRepo.addMockItem(invoiceItem);

  mockTransactionRepo.addMockItem(transaction);
  mockInvoiceRepo.addMockItem(invoice);
});

Given(
  /^the notification "([\w-]+)" for invoice "([\w-]+)"/,
  async (testNotificationId: string, testInvoiceId: string) => {
    const invoiceId = InvoiceId.create(
      new UniqueEntityID(testInvoiceId)
    ).getValue();
    pausedReminder = {
      invoiceId,
      confirmation: true,
      payment: false,
    };
    mockPausedReminderRepo.addMockItem(pausedReminder);

    notification = makeNotificationData(testNotificationId, testInvoiceId);
    mockSentNotificationRepo.addMockItem(notification);
  }
);

Given(
  /^the notification "([\w-]+)" for confirmed invoice "([\w-]+)"/,
  async (testNotificationId: string, testInvoiceId: string) => {
    const invoiceId = InvoiceId.create(
      new UniqueEntityID(testInvoiceId)
    ).getValue();
    pausedReminder = {
      invoiceId,
      confirmation: false,
      payment: false,
    };
    mockPausedReminderRepo.addMockItem(pausedReminder);

    notification = makeNotificationData(testNotificationId, testInvoiceId);
    mockSentNotificationRepo.addMockItem(notification);
  }
);

When(
  /^I try to resume confirmation reminders for "([\w-]+)"/,
  async (testInvoiceId: string) => {
    response = await usecase.execute(
      { reminderDelay: 5, invoiceId: testInvoiceId, queueName: 'test-queue' },
      context
    );
  }
);

Then(/^it should resume the reminders of type confirmation/, () => {
  expect(response.isRight()).to.be.true;
});

Then(/^it should return an error/, () => {
  expect(response.isLeft()).to.be.true;
});
