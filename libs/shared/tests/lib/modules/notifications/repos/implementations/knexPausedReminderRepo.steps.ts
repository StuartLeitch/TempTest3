import { expect } from 'chai';
import { Given, When, Then, Before, After } from '@cucumber/cucumber';

import { UniqueEntityID } from '../../../../../../src/lib/core/domain/UniqueEntityID';

import { InvoiceId } from '../../../../../../src/lib/modules/invoices/domain/InvoiceId';
import { NotificationPause } from '../../../../../../src/lib/modules/notifications/domain/NotificationPause';
import { MockPausedReminderRepo } from '../../../../../../src/lib/modules/notifications/repos/mocks/mockPausedReminderRepo';

let mockPausedReminderRepo: MockPausedReminderRepo = null;
let pausedNotification: NotificationPause = null;
let foundPausedNotification: NotificationPause = null;
let savedPausedNotification: NotificationPause = null;

Before({ tags: '@ValidateKnexPausedReminder' }, async () => {
  mockPausedReminderRepo = new MockPausedReminderRepo();
});

After({ tags: '@ValidateKnexPausedReminder' }, () => {
  mockPausedReminderRepo = null;
});
Given(
  /^an invoice with id "([\w-]+)" and a paused notification item$/,
  async (testInvoiceId: string) => {
    const invoiceId = InvoiceId.create(
      new UniqueEntityID(testInvoiceId)
    ).getValue();
    pausedNotification = { invoiceId, confirmation: true, payment: false };
    pausedNotification = await mockPausedReminderRepo.save(pausedNotification);
  }
);

When(
  /^we call getNotificationPausedStatus for "([\w-]+)"$/,
  async (testInvoiceId: string) => {
    const invoiceId = InvoiceId.create(
      new UniqueEntityID(testInvoiceId)
    ).getValue();

    foundPausedNotification = await mockPausedReminderRepo.getNotificationPausedStatus(
      invoiceId
    );
  }
);

Then(
  /^getNotificationPausedStatus returns the NotificationPause item$/,
  async () => {
    expect(foundPausedNotification.confirmation).to.equal(
      pausedNotification.confirmation
    );
    expect(foundPausedNotification.payment).to.equal(
      pausedNotification.payment
    );
  }
);

When(
  /^we call insertBasePause for "([\w-]+)"$/,
  async (testInvoiceId: string) => {
    const invoiceId = InvoiceId.create(
      new UniqueEntityID(testInvoiceId)
    ).getValue();

    savedPausedNotification = await mockPausedReminderRepo.insertBasePause(
      invoiceId
    );
  }
);

Then(/^insertBasePause should save the new paused reminder/, async () => {
  expect(savedPausedNotification.confirmation).to.equal(false);
  expect(savedPausedNotification.payment).to.equal(false);
});
