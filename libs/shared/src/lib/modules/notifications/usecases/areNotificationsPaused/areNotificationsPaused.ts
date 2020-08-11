/* eslint-disable @typescript-eslint/no-unused-vars */

// * Core Domain
import { Either, Result, right, left } from '../../../../core/logic/Result';
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';
import { AsyncEither } from '../../../../core/logic/AsyncEither';
import { UnexpectedError } from '../../../../core/logic/AppError';
import { UseCase } from '../../../../core/domain/UseCase';

// * Authorization Logic
import {
  AccessControlledUsecase,
  UsecaseAuthorizationContext,
  AccessControlContext,
} from '../../../../domain/authorization';

import { LoggerContract } from '../../../../infrastructure/logging/Logger';
import { PausedReminderRepoContract } from '../../repos/PausedReminderRepo';

import { NotificationPause } from '../../domain/NotificationPause';
import { InvoiceId } from '../../../invoices/domain/InvoiceId';
import { NotificationType } from '../../domain/Notification';

// * Usecase specific
import { AreNotificationsPausedResponse as Response } from './areNotificationsPausedResponse';
import { AreNotificationsPausedDTO as DTO } from './areNotificationsPausedDTO';
import * as Errors from './areNotificationsPausedErrors';

type TypeToPauseMap = {
  [key in NotificationType]: keyof Omit<NotificationPause, 'invoiceId'>;
};

const notificationTypeToPause: TypeToPauseMap = {
  REMINDER_CONFIRMATION: 'confirmation',
  REMINDER_PAYMENT: 'payment',
  SANCTIONED_COUNTRY: null,
  INVOICE_CREATED: null,
};

export class AreNotificationsPausedUsecase
  implements
    UseCase<DTO, Promise<Response>, UsecaseAuthorizationContext>,
    AccessControlledUsecase<
      DTO,
      UsecaseAuthorizationContext,
      AccessControlContext
    > {
  constructor(
    private pausedReminderRepo: PausedReminderRepoContract,
    private loggerService: LoggerContract
  ) {
    this.fetchNotificationPauses = this.fetchNotificationPauses.bind(this);
    this.validateRequest = this.validateRequest.bind(this);
    this.getPauseStatus = this.getPauseStatus.bind(this);
  }

  private async getAccessControlContext(request, context?) {
    return {};
  }

  // @Authorize('invoice:read')
  public async execute(
    request: DTO,
    context?: UsecaseAuthorizationContext
  ): Promise<Response> {
    try {
      const execution = new AsyncEither(request)
        .then(this.validateRequest)
        .then(this.fetchNotificationPauses)
        .map(this.getPauseStatus(request))
        .map((val) => Result.ok(val));
      return execution.execute();
    } catch (e) {
      return left(new UnexpectedError(e));
    }
  }

  private async validateRequest(
    request: DTO
  ): Promise<
    Either<
      | Errors.NotificationTypeRequired
      | Errors.InvalidNotificationType
      | Errors.InvoiceIdRequired,
      DTO
    >
  > {
    this.loggerService.info(`Validate the usecase request data`);

    const { notificationType, invoiceId } = request;

    if (!invoiceId) {
      return left(new Errors.InvoiceIdRequired());
    }

    if (!notificationType) {
      return left(new Errors.NotificationTypeRequired());
    }

    if (!(notificationType in NotificationType)) {
      return left(new Errors.InvalidNotificationType(request.notificationType));
    }

    return right(request);
  }

  private async fetchNotificationPauses(
    request: DTO
  ): Promise<Either<Errors.EncounteredDbError, NotificationPause>> {
    this.loggerService.info(
      `Fetch pause state for reminders of invoice with id ${request.invoiceId}`
    );

    const uuid = new UniqueEntityID(request.invoiceId);
    const invoiceId = InvoiceId.create(uuid).getValue();

    try {
      const result = await this.pausedReminderRepo.getNotificationPausedStatus(
        invoiceId
      );

      return right(result);
    } catch (e) {
      return left(new Errors.EncounteredDbError(invoiceId.id.toString(), e));
    }
  }

  private getPauseStatus(request: DTO) {
    return (pauses: NotificationPause): boolean => {
      this.loggerService.info(
        `Extract pause state for reminders of type ${request.notificationType}`
      );

      const { notificationType } = request;
      return pauses[notificationTypeToPause[notificationType]] || false;
    };
  }
}
