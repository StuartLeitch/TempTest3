/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// * Core Domain
import { LoggerContract } from '../../../../infrastructure/logging/Logger';
import { Either, left, right } from '../../../../core/logic/Either';
import { UnexpectedError } from '../../../../core/logic/AppError';
import { AsyncEither } from '../../../../core/logic/AsyncEither';
import { UseCase } from '../../../../core/domain/UseCase';

// * Authorization Logic
import {
  UsecaseAuthorizationContext as Context,
  AccessControlledUsecase,
  AccessControlContext,
} from '../../../../domain/authorization';

// * Usecase specific
import { PayerRepoContract } from '../../../payers/repos/payerRepo';
import { ArticleRepoContract } from '../../../manuscripts/repos';
import { CouponRepoContract } from '../../../coupons/repos';
import { WaiverRepoContract } from '../../../waivers/repos';
import { PaymentRepoContract } from '../../repos';
import {
  InvoiceItemRepoContract,
  InvoiceRepoContract,
} from '../../../invoices/repos';

import { GetItemsForInvoiceUsecase } from '../../../invoices/usecases/getItemsForInvoice/getItemsForInvoice';
import { GetInvoiceDetailsUsecase } from '../../../invoices/usecases/getInvoiceDetails/getInvoiceDetails';
import { GetManuscriptByInvoiceIdUsecase } from '../../../manuscripts/usecases/getManuscriptByInvoiceId';
import { GetPayerDetailsByInvoiceIdUsecase } from '../../../payers/usecases/getPayerDetailsByInvoiceId';
import { CreatePaymentUsecase, CreatePaymentDTO } from '../createPayment';

import { PaymentDTO } from '../../domain/strategies/behaviors';
import {
  PaymentStrategySelectionData,
  PaymentStrategyFactory,
} from '../../domain/strategies/payment-strategy-factory';
import { PaymentStrategy } from '../../domain/strategies/payment-strategy';

import {
  SelectionData,
  WithInvoiceId,
  PaymentData,
  WithInvoice,
  WithPayment,
} from './helper-types';

import { RecordPaymentResponse as Response } from './recordPaymentResponse';
import { RecordPaymentDTO as DTO } from './recordPaymentDTO';
import * as Errors from './recordPaymentErrors';

export class RecordPaymentUsecase
  implements
    UseCase<DTO, Promise<Response>, Context>,
    AccessControlledUsecase<DTO, Context, AccessControlContext> {
  constructor(
    private strategyFactory: PaymentStrategyFactory,
    private invoiceItemRepo: InvoiceItemRepoContract,
    private manuscriptRepo: ArticleRepoContract,
    private paymentRepo: PaymentRepoContract,
    private invoiceRepo: InvoiceRepoContract,
    private couponRepo: CouponRepoContract,
    private waiverRepo: WaiverRepoContract,
    private payerRepo: PayerRepoContract,
    private logger: LoggerContract
  ) {
    this.attachInvoiceItems = this.attachInvoiceItems.bind(this);
    this.attachManuscript = this.attachManuscript.bind(this);
    this.validateRequest = this.validateRequest.bind(this);
    this.attachStrategy = this.attachStrategy.bind(this);
    this.attachInvoice = this.attachInvoice.bind(this);
    this.createPayment = this.createPayment.bind(this);
    this.attachPayer = this.attachPayer.bind(this);
    this.savePayment = this.savePayment.bind(this);
  }

  public async execute(request: DTO, context?: Context): Promise<Response> {
    try {
      const result = await new AsyncEither(request)
        .then(this.validateRequest)
        .then(this.attachInvoice(context))
        .then(this.attachInvoiceItems(context))
        .then(this.attachPayer(context))
        .then(this.attachManuscript(context))
        .then(this.attachStrategy)
        .then(this.createPayment)
        .then(this.savePayment(context))
        .map((data) => data.payment)
        .execute();
      return result;
    } catch (e) {
      return left(this.newUnexpectedError(e, request.invoiceId));
    }
  }

  private async validateRequest<T extends DTO>(
    request: T
  ): Promise<Either<Errors.InvoiceIdRequiredError, T>> {
    if (!request.invoiceId) {
      return left(new Errors.InvoiceIdRequiredError());
    }

    return right(request);
  }

  private attachInvoice(context: Context) {
    return async <T extends WithInvoiceId>(request: T) => {
      const usecase = new GetInvoiceDetailsUsecase(this.invoiceRepo);

      return new AsyncEither(request.invoiceId)
        .then((invoiceId) => usecase.execute({ invoiceId }, context))
        .map((result) => result.getValue())
        .map((invoice) => ({
          ...request,
          invoice,
        }))
        .execute();
    };
  }

  private attachInvoiceItems(context: Context) {
    return async <T extends WithInvoice>(request: T) => {
      const usecase = new GetItemsForInvoiceUsecase(
        this.invoiceItemRepo,
        this.couponRepo,
        this.waiverRepo
      );

      return new AsyncEither(request.invoice.id.toString())
        .then((invoiceId) => usecase.execute({ invoiceId }, context))
        .map((result) => result.getValue())
        .map((items) => {
          request.invoice.addItems(items);
          return request;
        })
        .execute();
    };
  }

  private attachPayer(context: Context) {
    return async <T extends WithInvoiceId>(request: T) => {
      const usecase = new GetPayerDetailsByInvoiceIdUsecase(
        this.payerRepo,
        this.logger
      );

      return new AsyncEither(request.invoiceId)
        .then((invoiceId) => usecase.execute({ invoiceId }, context))
        .map((result) => result.getValue())
        .map((payer) => ({ ...request, payer }))
        .execute();
    };
  }

  private attachManuscript(context: Context) {
    return async <T extends WithInvoiceId>(request: T) => {
      const usecase = new GetManuscriptByInvoiceIdUsecase(
        this.manuscriptRepo,
        this.invoiceItemRepo
      );

      return new AsyncEither(request.invoiceId)
        .then((invoiceId) => usecase.execute({ invoiceId }, context))
        .map((result) => result.getValue()[0])
        .map((manuscript) => ({ ...request, manuscript }))
        .execute();
    };
  }

  private async attachStrategy<T extends SelectionData>(
    request: T
  ): Promise<Either<void, T & { strategy: PaymentStrategy }>> {
    const { payerIdentification, paymentReference } = request;
    const data: PaymentStrategySelectionData = {
      payerIdentification,
      paymentReference,
    };
    const strategy = await this.strategyFactory.selectStrategy(data);

    return right({
      ...request,
      strategy,
    });
  }

  private async createPayment<T extends PaymentData>(request: T) {
    const {
      payerIdentification,
      paymentReference,
      manuscript,
      strategy,
      invoice,
    } = request;
    const makePaymentData: PaymentDTO = {
      invoiceReferenceNumber: invoice.referenceNumber,
      discountAmount: invoice.invoiceDiscountTotal,
      manuscriptCustomId: manuscript.customId,
      invoiceTotal: invoice.invoiceTotal,
      netAmount: invoice.invoiceNetTotal,
      vatAmount: invoice.invoiceVatTotal,
      invoiceId: invoice.id.toString(),
      payerIdentification,
      paymentReference,
    };

    return new AsyncEither(makePaymentData)
      .then((data) => strategy.makePayment(data))
      .map((paymentDetails) => ({ ...request, paymentDetails }))
      .execute();
  }

  private savePayment(context: Context) {
    return async <T extends WithPayment>(request: T) => {
      const usecase = new CreatePaymentUsecase(this.paymentRepo);
      const { paymentDetails, invoice, payer, datePaid } = request;

      const dto: CreatePaymentDTO = {
        paymentMethodId: paymentDetails.paymentMethodId.toString(),
        foreignPaymentId: paymentDetails.foreignPaymentId.id,
        isFinalPayment: request.isFinalPayment ?? true,
        invoiceId: invoice.id.toString(),
        status: paymentDetails.status,
        amount: invoice.invoiceTotal,
        payerId: payer.id.toString(),
        datePaid,
      };

      return new AsyncEither(dto)
        .then((data) => usecase.execute(data, context))
        .map((payment) => ({ ...request, payment }))
        .execute();
    };
  }

  private newUnexpectedError(e: Error, id: string): UnexpectedError {
    return new UnexpectedError(
      e,
      `Recording payment for invoice with id {${id}}`
    );
  }
}
