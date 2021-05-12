import { expect } from 'chai';
import { Given, When, Then, Before } from '@cucumber/cucumber';

import { MockLogger } from '../../../../../../src/lib/infrastructure/logging/mocks/MockLogger';
import { EmailService } from '../../../../../../src/lib/infrastructure/communication-channels/EmailService';
import { setupVatService } from '../../../../../../src/lib/domain/services/mocks/VatSoapClient';

import { ApplyCouponToInvoiceUsecase } from '../../../../../../src/lib/modules/coupons/usecases/applyCouponToInvoice/applyCouponToInvoice';
import { ApplyCouponToInvoiceResponse } from '../../../../../../src/lib/modules/coupons/usecases/applyCouponToInvoice/applyCouponToInvoiceResponse';

import {
  Coupon,
  CouponType,
} from '../../../../../../src/lib/modules/coupons/domain/Coupon';
import { MockInvoiceRepo } from '../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceRepo';
import { MockInvoiceItemRepo } from '../../../../../../src/lib/modules/invoices/repos/mocks/mockInvoiceItemRepo';
import { MockCouponRepo } from '../../../../../../src/lib/modules/coupons/repos/mocks/mockCouponRepo';
import { MockTransactionRepo } from '../../../../../../src/lib/modules/transactions/repos/mocks/mockTransactionRepo';
import { MockArticleRepo } from '../../../../../../src/lib/modules/manuscripts/repos/mocks/mockArticleRepo';
import { MockAddressRepo } from '../../../../../../src/lib/modules/addresses/repos/mocks/mockAddressRepo';
import { MockCatalogRepo } from '../../../../../../src/lib/modules/journals/repos/mocks/mockCatalogRepo';
import { MockPayerRepo } from '../../../../../../src/lib/modules/payers/repos/mocks/mockPayerRepo';
import { MockWaiverRepo } from '../../../../../../src/lib/modules/waivers/repos/mocks/mockWaiverRepo';
import { MockPublisherRepo } from '../../../../../../src/lib/modules/publishers/repos/mocks/mockPublisherRepo';
import { PublisherMap } from '../../../../../../src/lib/modules/publishers/mappers/PublisherMap';

import {
  AddressMap,
  ArticleMap,
  CatalogMap,
  CouponMap,
  Invoice,
  InvoiceMap,
  InvoiceItemMap,
  PayerMap,
  PayerType,
  Roles,
  TransactionMap,
  TransactionStatus,
  UsecaseAuthorizationContext,
} from '../../../../../../src/lib/shared';

function makeCouponData(id: string, code: string, overwrites?: any): Coupon {
  return CouponMap.toDomain({
    id,
    code,
    status: 'ACTIVE',
    redeemCount: 1,
    dateCreated: new Date(),
    invoiceItemType: 'APC',
    name: 'test-coupon',
    ...overwrites,
  });
}
function makeInactiveCouponData(code: string, overwrites?: any): Coupon {
  return CouponMap.toDomain({
    id: 'inactivecoupon',
    code,
    status: 'INACTIVE',
    redeemCount: 1,
    dateCreated: new Date(),
    invoiceItemType: 'APC',
    name: 'test-coupon',
    ...overwrites,
  });
}

function makeSingleUseCouponData(code: string, overwrites?: any): Coupon {
  return CouponMap.toDomain({
    id: 'usedcoupon',
    code,
    status: 'ACTIVE',
    couponType: 'SINGLE_USE',
    redeemCount: 1,
    dateCreated: new Date(),
    invoiceItemType: 'APC',
    name: 'test-coupon',
    ...overwrites,
  });
}

let mockInvoiceRepo: MockInvoiceRepo;
let mockInvoiceItemRepo: MockInvoiceItemRepo;
let mockCouponRepo: MockCouponRepo;
let mockTransactionRepo: MockTransactionRepo;
let mockManuscriptRepo: MockArticleRepo;
let mockAddressRepo: MockAddressRepo;
let mockPayerRepo: MockPayerRepo;
let mockCatalogRepo: MockCatalogRepo;
let mockWaiverRepo: MockWaiverRepo;
let mockPublisherRepo: MockPublisherRepo;
let emailService: EmailService;
let mockLogger: MockLogger;
let mockVatService: any;
let mailingDisabled: boolean;
let fePath: string;
let tenantName: string;

let usecase: ApplyCouponToInvoiceUsecase;
let response: ApplyCouponToInvoiceResponse;

const context: UsecaseAuthorizationContext = {
  roles: [Roles.ADMIN],
};

let invoice: Invoice;
let coupon: Coupon;

Before(() => {
  mockInvoiceItemRepo = new MockInvoiceItemRepo();
  mockCouponRepo = new MockCouponRepo();
  mockTransactionRepo = new MockTransactionRepo();
  mockManuscriptRepo = new MockArticleRepo();
  mockAddressRepo = new MockAddressRepo();
  mockPayerRepo = new MockPayerRepo();
  mockCatalogRepo = new MockCatalogRepo();
  mockPublisherRepo = new MockPublisherRepo();
  mockWaiverRepo = new MockWaiverRepo();
  emailService = new EmailService(mailingDisabled, fePath, tenantName);
  mockLogger = new MockLogger();
  mockInvoiceRepo = new MockInvoiceRepo(
    mockManuscriptRepo,
    mockInvoiceItemRepo
  );

  mockVatService = setupVatService();

  usecase = new ApplyCouponToInvoiceUsecase(
    mockInvoiceRepo,
    mockInvoiceItemRepo,
    mockCouponRepo,
    mockTransactionRepo,
    mockManuscriptRepo,
    mockAddressRepo,
    mockPayerRepo,
    mockWaiverRepo,
    emailService,
    mockVatService,
    mockLogger
  );
});

Given(
  /^we have an Invoice with id "([\w-]+)"/,
  async (testInvoiceId: string) => {
    const transaction = TransactionMap.toDomain({
      status: TransactionStatus.ACTIVE,
      deleted: 0,
      dateCreated: new Date(),
      dateUpdated: new Date(),
    });
    invoice = InvoiceMap.toDomain({
      transactionId: transaction.id.toValue(),
      status: 'DRAFT',
      dateCreated: new Date(),
      id: testInvoiceId,
    });

    const publisher = PublisherMap.toDomain({
      id: 'publisher1',
      customValues: {},
    } as any);

    const catalog = CatalogMap.toDomain({
      publisherId: publisher.publisherId.id.toString(),
      isActive: true,
      journalId: 'journal1',
    });

    const datePublished = new Date();
    const manuscript = ArticleMap.toDomain({
      customId: '8888',
      journalId: catalog.journalId.id.toValue(),
      datePublished: datePublished.setDate(datePublished.getDate() - 1),
    });

    const invoiceItem = InvoiceItemMap.toDomain({
      invoiceId: testInvoiceId,
      manuscriptId: manuscript.manuscriptId.id.toValue().toString(),
      price: 100,
      vat: 0,
    });

    const address = AddressMap.toDomain({
      country: 'RO',
    });
    const payer = PayerMap.toDomain({
      name: 'Silvestru',
      addressId: address.id.toValue(),
      invoiceId: invoice.invoiceId.id.toValue(),
      type: PayerType.INDIVIDUAL,
    });

    mockPayerRepo.addMockItem(payer);
    mockAddressRepo.addMockItem(address);

    mockPublisherRepo.addMockItem(publisher);
    mockCatalogRepo.addMockItem(catalog);
    mockManuscriptRepo.addMockItem(manuscript);
    mockInvoiceItemRepo.addMockItem(invoiceItem);

    mockTransactionRepo.addMockItem(transaction);
    mockInvoiceRepo.addMockItem(invoice);
  }
);

Given(
  /^a coupon with id "([\w-]+)" with code "([\w-]+)"/,
  async (testCouponId: string, testCode: string) => {
    coupon = makeCouponData(testCouponId, testCode);
    coupon = await mockCouponRepo.save(coupon);
  }
);

When(
  /^I apply coupon for invoice "([\w-]+)" with code "([\w-]+)"/,
  async (testInvoiceId: string, testCode: string) => {
    response = await usecase.execute({
      invoiceId: testInvoiceId,
      couponCode: testCode,
    });
  }
);

Then(
  /^coupon should be applied for invoice "([\w-]+)"/,
  (testInvoiceId: string) => {
    expect(response.isRight()).to.be.true;
  }
);

When(
  /^I apply inactive coupon for invoice "([\w-]+)" with code "([\w-]+)"/,
  async (testInvoiceId: string, testCode: string) => {
    let inactiveCoupon = makeInactiveCouponData(testCode);
    inactiveCoupon = await mockCouponRepo.save(inactiveCoupon);

    response = await usecase.execute({
      invoiceId: testInvoiceId,
      couponCode: testCode,
    });
  }
);

Then(/^I receive an error that coupon is inactive/, () => {
  expect(response.isLeft()).to.be.true;
});
