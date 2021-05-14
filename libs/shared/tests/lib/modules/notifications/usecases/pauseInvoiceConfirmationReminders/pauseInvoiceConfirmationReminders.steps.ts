import { expect } from 'chai';
import { Given, When, Then, Before } from '@cucumber/cucumber';

import { MockLogger } from '../../../../../../src/lib/infrastructure/logging/mocks/MockLogger';

import { PauseInvoiceConfirmationRemindersUsecase } from '../../../../../../src/lib/modules/notifications/usecases/pauseInvoiceConfirmationReminders';
import { PauseInvoiceConfirmationRemindersResponse } from '../../../../../../src/lib/modules/notifications/usecases/pauseInvoiceConfirmationReminders/pauseInvoiceConfirmationRemindersResponse';

import {
  NotificationType,
  Notification,
} from '../../../../../../src/lib/modules/notifications/domain/Notification';
import { NotificationMap } from '../../../../../../src/lib/modules/notifications/mappers/NotificationMap';
import { MockPausedReminderRepo } from '../../../../../../src/lib/modules/notifications/repos/mocks/mockPausedReminderRepo';
import { MockSentNotificationRepo } from '../../../../../../src/lib/modules/notifications/repos/mocks/mockSentNotificationRepo';
import { MockInvoiceRepo } from '../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceRepo';
import { MockInvoiceItemRepo } from './../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceItemRepo';
import { MockArticleRepo } from './../../../../../../src/lib/modules/manuscripts/repos/mocks/mockArticleRepo';
import { MockErpReferenceRepo } from './../../../../../../src/lib/modules/vendors/repos/mocks/mockErpReferenceRepo';

import {
  Roles,
  UsecaseAuthorizationContext,
} from '../../../../../../src/lib/shared';
import { InvoiceMap } from './../../../../../../src/lib/modules/invoices/mappers/InvoiceMap';
import { InvoiceId } from '../../../../../../src/lib/modules/invoices/domain/InvoiceId';
import { UniqueEntityID } from '../../../../../../src/lib/core/domain/UniqueEntityID';
import { NotificationPause } from '../../../../../../src/lib/modules/notifications/domain/NotificationPause';

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
let notification: Notification;
let pausedReminder: NotificationPause;
let response: PauseInvoiceConfirmationRemindersResponse;
let usecase: PauseInvoiceConfirmationRemindersUsecase;

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

  usecase = new PauseInvoiceConfirmationRemindersUsecase(
    mockPausedReminderRepo,
    mockInvoiceRepo,
    mockLogger
  );
});

Given(/^the invoice "([\w-]+)" id/, async (testInvoiceId: string) => {
  const invoice = InvoiceMap.toDomain({
    transactionId: 'transaction-id',
    dateCreated: new Date(),
    id: testInvoiceId,
  });

  await mockInvoiceRepo.save(invoice);
});

Given(
  /^notification with "([\w-]+)" for invoice "([\w-]+)"/,
  async (testNotificationId: string, testInvoiceId: string) => {
    const invoiceId = InvoiceId.create(
      new UniqueEntityID(testInvoiceId)
    ).getValue();

    notification = makeNotificationData(testNotificationId, testInvoiceId);
    notification = await mockSentNotificationRepo.save(notification);

    pausedReminder = { invoiceId, confirmation: false, payment: false };
    pausedReminder = await mockPausedReminderRepo.save(pausedReminder);
  }
);

When(
  /^I try to pause reminders of given type for "([\w-]+)"/,
  async (testInvoiceId: string) => {
    response = await usecase.execute({ invoiceId: testInvoiceId }, context);
  }
);

Then(/^the confirmation reminder should be paused/, () => {
  expect(response.isRight()).to.be.true;
});

Then(/^an error should occur saying the pause state does not exist/, () => {
  expect(response.isLeft()).to.be.true;
  expect(response.value.error)
    .to.have.property('message')
    .to.equal('While saving the pause state an error ocurred: does not exist');
});
