import { expect } from 'chai';
import { Given, When, Then, Before } from 'cucumber';

import { ChangeInvoiceStatus } from '../../../../../../src/lib/modules/invoices/usecases/changeInvoiceStatus/changeInvoiceStatus';
import { ChangeInvoiceStatusResponse } from './../../../../../../src/lib/modules/invoices/usecases/changeInvoiceStatus/changeInvoiceStatusResponse';
import { MockInvoiceRepo } from '../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceRepo';
import { InvoiceMap } from './../../../../../../src/lib/modules/invoices/mappers/InvoiceMap';
import { InvoiceId } from '../../../../../../src/lib/modules/invoices/domain/InvoiceId';
import { UniqueEntityID } from '../../../../../../src/lib/core/domain/UniqueEntityID';

let mockInvoiceRepo: MockInvoiceRepo;
let response: ChangeInvoiceStatusResponse;

let useCase: ChangeInvoiceStatus;

Before(function () {
  mockInvoiceRepo = new MockInvoiceRepo();
  useCase = new ChangeInvoiceStatus(mockInvoiceRepo);
});

Given(/^There is an Invoice with an existing ID "([\w-]+)"$/, async function (
  testInvoiceId: string
) {
  const invoice = InvoiceMap.toDomain({
    transactionId: 'transaction-id',
    dateCreated: new Date(),
    id: testInvoiceId,
  });
  mockInvoiceRepo.save(invoice);
});

Given(
  /^There is an Invoice with a non-existing ID "([\w-]+)"$/,
  async function (testInvoiceId: string) {
    return;
  }
);

When(
  /I try update the status for the Invoice with ID "([\w-]+)" to (.+)/,
  async function (testInvoiceId, status: string) {
    response = await useCase.execute({
      invoiceId: testInvoiceId,
      status,
    });
  }
);

Then(
  /The Invoice with ID "([\w-]+)" is successfully updated to (.+)/,
  async function (testInvoiceId: string, status: string) {
    const invoiceId = InvoiceId.create(
      new UniqueEntityID(testInvoiceId)
    ).getValue();

    const invoice = await mockInvoiceRepo.getInvoiceById(invoiceId);
    expect(invoice.status).to.equal(status);
  }
);

Then('An InvoiceNotFoundError error is returned', function () {
  expect(response.value.isFailure).to.equal(true);
  // expect(response.value.errorValue().message).to.equal(`Couldn't update invoice with id unknown-id.`);
});
