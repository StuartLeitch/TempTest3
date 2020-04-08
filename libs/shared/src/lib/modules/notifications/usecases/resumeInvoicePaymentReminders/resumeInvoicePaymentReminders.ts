import {
  SchedulingTime,
  SisifJobTypes,
  TimerBuilder,
  JobBuilder
} from '@hindawi/sisif';

// * Core Domain
import { Either, Result, right, left } from '../../../../core/logic/Result';
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';
import { AsyncEither } from '../../../../core/logic/AsyncEither';
import { AppError } from '../../../../core/logic/AppError';
import { UseCase } from '../../../../core/domain/UseCase';

// * Authorization Logic
import { AccessControlContext } from '../../../../domain/authorization/AccessControl';
import { Roles } from '../../../users/domain/enums/Roles';
import {
  AccessControlledUsecase,
  AuthorizationContext,
  Authorize
} from '../../../../domain/authorization/decorators/Authorize';

import { LoggerContract } from '../../../../infrastructure/logging/Logger';

import { PayloadBuilder } from '../../../../infrastructure/message-queues/payloadBuilder';
import { SchedulerContract } from '../../../../infrastructure/scheduler/Scheduler';

import { InvoiceItemRepoContract } from '../../../invoices/repos/invoiceItemRepo';
import { ArticleRepoContract } from '../../../manuscripts/repos/articleRepo';
import { PausedReminderRepoContract } from '../../repos/PausedReminderRepo';
import { PayerRepoContract } from '../../../payers/repos/payerRepo';
import { InvoiceRepoContract } from '../../../invoices/repos';

import { GetInvoiceDetailsUsecase } from '../../../invoices/usecases/getInvoiceDetails/getInvoiceDetails';
import { GetManuscriptByInvoiceIdUsecase } from '../../../manuscripts/usecases/getManuscriptByInvoiceId';
import { GetPayerDetailsByInvoiceIdUsecase } from '../../../payers/usecases/getPayerDetailsByInvoiceId';
import { AreNotificationsPausedUsecase } from '../areNotificationsPaused';

import { InvoiceStatus, Invoice } from '../../../invoices/domain/Invoice';
import { Manuscript } from '../../../manuscripts/domain/Manuscript';
import { InvoiceId } from '../../../invoices/domain/InvoiceId';
import { NotificationType } from '../../domain/Notification';
import { Payer } from '../../../payers/domain/Payer';

// * Usecase specific
import { ResumeInvoicePaymentRemindersResponse as Response } from './resumeInvoicePaymentRemindersResponse';
import { ResumeInvoicePaymentRemindersErrors as Errors } from './resumeInvoicePaymentRemindersErrors';
import { ResumeInvoicePaymentRemindersDTO as DTO } from './resumeInvoicePaymentRemindersDTO';

interface CompoundDTO extends DTO {
  manuscript: Manuscript;
  invoice: Invoice;
  payer: Payer;
}

type Context = AuthorizationContext<Roles>;
export type ResumeInvoicePaymentReminderContext = Context;

export class ResumeInvoicePaymentReminderUsecase
  implements
    UseCase<DTO, Promise<Response>, Context>,
    AccessControlledUsecase<DTO, Context, AccessControlContext> {
  constructor(
    private pausedReminderRepo: PausedReminderRepoContract,
    private invoiceItemRepo: InvoiceItemRepoContract,
    private manuscriptRepo: ArticleRepoContract,
    private invoiceRepo: InvoiceRepoContract,
    private payerRepo: PayerRepoContract,
    private loggerService: LoggerContract,
    private scheduler: SchedulerContract
  ) {
    this.calculateRemainingDelay = this.calculateRemainingDelay.bind(this);
    this.shouldResumeReminder = this.shouldResumeReminder.bind(this);
    this.existsInvoiceWithId = this.existsInvoiceWithId.bind(this);
    this.validatePauseState = this.validatePauseState.bind(this);
    this.shouldScheduleJob = this.shouldScheduleJob.bind(this);
    this.validateRequest = this.validateRequest.bind(this);
    this.getManuscript = this.getManuscript.bind(this);
    this.scheduleJob = this.scheduleJob.bind(this);
    this.getInvoice = this.getInvoice.bind(this);
    this.getPayer = this.getPayer.bind(this);
    this.resume = this.resume.bind(this);
  }

  private async getAccessControlContext(request, context?) {
    return {};
  }

  // @Authorize('invoice:read')
  public async execute(request: DTO, context?: Context): Promise<Response> {
    try {
      const execution = new AsyncEither(request)
        .then(this.validateRequest)
        .then(this.validatePauseState(context))
        .then(this.getInvoice(context))
        .then(this.getManuscript(context))
        .then(this.getPayer(context))
        .advanceOrEnd(this.shouldResumeReminder)
        .then(this.resume)
        .advanceOrEnd(this.shouldScheduleJob)
        .then(this.scheduleJob)
        .map(() => Result.ok<void>(null));

      return execution.execute();
    } catch (e) {
      return left(new AppError.UnexpectedError(e));
    }
  }

  private async validateRequest(
    request: DTO
  ): Promise<
    Either<
      | Errors.ReminderDelayRequiredError
      | Errors.InvoiceIdRequiredError
      | Errors.QueueNameRequiredError
      | Errors.InvoiceNotFoundError,
      DTO
    >
  > {
    this.loggerService.info(`Validate usecase request data`);

    if (!request.invoiceId) {
      return left(new Errors.InvoiceIdRequiredError());
    }

    const invoiceExists = await this.existsInvoiceWithId(request.invoiceId);
    if (!invoiceExists) {
      return left(new Errors.InvoiceNotFoundError(request.invoiceId));
    }

    if (!request.queueName) {
      return left(new Errors.QueueNameRequiredError());
    }

    if (!request.reminderDelay) {
      return left(new Errors.ReminderDelayRequiredError());
    }

    return right(request);
  }

  private async existsInvoiceWithId(id: string) {
    this.loggerService.info(`Check if invoice with id ${id} exists in the DB`);

    const uuid = new UniqueEntityID(id);
    const invoiceId = InvoiceId.create(uuid).getValue();

    return await this.invoiceRepo.existsWithId(invoiceId);
  }

  private validatePauseState(context: Context) {
    return async (request: DTO) => {
      this.loggerService.info(
        `Validate the state of the reminders of type ${NotificationType.REMINDER_PAYMENT} for invoice with id ${request.invoiceId}`
      );

      const usecase = new AreNotificationsPausedUsecase(
        this.pausedReminderRepo,
        this.loggerService
      );
      const { invoiceId } = request;
      const maybeResult = await usecase.execute(
        { invoiceId, notificationType: NotificationType.REMINDER_PAYMENT },
        context
      );

      return maybeResult
        .map(result => result.getValue())
        .chain(isPaused => {
          if (!isPaused) {
            return left<Errors.PaymentRemindersNotPausedError, DTO>(
              new Errors.PaymentRemindersNotPausedError(invoiceId)
            );
          } else {
            return right<null, DTO>(request);
          }
        });
    };
  }

  private getInvoice(context: Context) {
    return async (request: CompoundDTO) => {
      this.loggerService.info(
        `Get details of invoice with id ${request.invoiceId}`
      );

      const usecase = new GetInvoiceDetailsUsecase(this.invoiceRepo);
      const { invoiceId } = request;
      const maybeResult = await usecase.execute({ invoiceId }, context);

      return maybeResult.map(result => ({
        ...request,
        invoice: result.getValue()
      }));
    };
  }

  private getManuscript(context: Context) {
    return async (request: CompoundDTO) => {
      this.loggerService.info(
        `Get details of manuscript associated with invoice with id ${request.invoiceId}`
      );

      const usecase = new GetManuscriptByInvoiceIdUsecase(
        this.manuscriptRepo,
        this.invoiceItemRepo
      );
      const { invoiceId } = request;
      const maybeResult = await usecase.execute({ invoiceId }, context);

      return maybeResult.map(result => ({
        ...request,
        manuscript: result.getValue()[0]
      }));
    };
  }

  private getPayer(context: Context) {
    return async (request: CompoundDTO) => {
      const usecase = new GetPayerDetailsByInvoiceIdUsecase(
        this.payerRepo,
        this.loggerService
      );

      const { invoiceId } = request;
      const maybeResult = await usecase.execute(
        {
          invoiceId
        },
        context
      );

      return maybeResult.map(result => ({
        ...request,
        payer: result.getValue()
      }));
    };
  }

  private async resume(
    request: CompoundDTO
  ): Promise<Either<Errors.ReminderResumeSaveDbError, CompoundDTO>> {
    this.loggerService.info(
      `Save the un-paused state of reminders of type ${NotificationType.REMINDER_PAYMENT} from invoice with id ${request.invoiceId}`
    );

    try {
      await this.pausedReminderRepo.setReminderPauseState(
        request.invoice.invoiceId,
        false,
        NotificationType.REMINDER_PAYMENT
      );
      return right(request);
    } catch (e) {
      return left(new Errors.ReminderResumeSaveDbError(e));
    }
  }

  private async scheduleJob(
    request: CompoundDTO
  ): Promise<Either<Errors.ScheduleTaskFailed, void>> {
    this.loggerService.info(
      `Schedule the next job for sending reminders of type ${NotificationType.REMINDER_PAYMENT} for invoice with id ${request.invoiceId}`
    );

    const { reminderDelay, manuscript, queueName, invoice, payer } = request;
    const { email, name } = payer;
    const data = PayloadBuilder.invoiceReminder(
      manuscript.customId,
      email.value,
      name.value,
      ''
    );
    const remainingDelay = this.calculateRemainingDelay(
      invoice.dateAccepted,
      reminderDelay
    );
    const timer = TimerBuilder.delayed(remainingDelay, SchedulingTime.Day);
    const newJob = JobBuilder.basic(SisifJobTypes.InvoicePaymentReminder, data);

    try {
      await this.scheduler.schedule(newJob, queueName, timer);
    } catch (e) {
      await this.pausedReminderRepo.setReminderPauseState(
        request.invoice.invoiceId,
        true,
        NotificationType.REMINDER_PAYMENT
      );
      return left(new Errors.ScheduleTaskFailed(e));
    }
  }

  private async shouldResumeReminder(request: CompoundDTO) {
    this.loggerService.info(
      `Determine if the reminders of type ${NotificationType.REMINDER_PAYMENT} should be resumed for invoice with id ${request.invoiceId}`
    );

    if (request.invoice.status !== InvoiceStatus.ACTIVE) {
      return right<null, boolean>(false);
    }

    return right<null, boolean>(true);
  }

  private async shouldScheduleJob(request: CompoundDTO) {
    this.loggerService.info(
      `Determine if the job for reminders of type ${NotificationType.REMINDER_PAYMENT} should be scheduled for invoice with id ${request.invoiceId}`
    );

    const elapsedTime =
      new Date().getTime() - request.invoice.dateIssued.getTime();
    const period = request.reminderDelay * SchedulingTime.Day;
    const passedPeriods = Math.trunc(elapsedTime / period);

    if (passedPeriods >= 3) {
      return right<null, boolean>(false);
    }

    return right<null, boolean>(true);
  }

  private calculateRemainingDelay(
    dateAccepted: Date,
    standardDelay: number
  ): number {
    this.loggerService.info(
      `Calculate the remaining delay until next reminder`
    );

    const elapsedTime = new Date().getTime() - dateAccepted.getTime();
    const period = standardDelay * SchedulingTime.Day;
    const passedPeriods = Math.trunc(elapsedTime / period);
    const nextTime = period * (passedPeriods + 1);

    return (nextTime - elapsedTime) / SchedulingTime.Day;
  }
}
