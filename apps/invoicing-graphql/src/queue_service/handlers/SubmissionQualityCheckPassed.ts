/* eslint-disable @nrwl/nx/enforce-module-boundaries */

// * Domain imports
import { SubmissionQualityCheckPassed as SubmissionQualityCheckPassedEvent } from '@hindawi/phenom-events';
import {
  GetTransactionDetailsByManuscriptCustomIdUsecase,
  UpdateTransactionOnAcceptManuscriptUsecase,
  UpdateTransactionContext,
  TransactionStatus,
  VersionCompare,
  Roles,
} from '@hindawi/shared';

import { ManuscriptTypeNotInvoiceable } from './../../../../../libs/shared/src/lib/modules/manuscripts/domain/ManuscriptTypes';

import { env } from '../../env';

const defaultContext: UpdateTransactionContext = { roles: [Roles.SUPER_ADMIN] };

const SUBMISSION_QUALITY_CHECK_PASSED = 'SubmissionQualityCheckPassed';

export const SubmissionQualityCheckPassed = {
  event: SUBMISSION_QUALITY_CHECK_PASSED,
  handler: async function submissionQualityCheckPassedHandler(
    data: SubmissionQualityCheckPassedEvent
  ): Promise<unknown> {
    const {
      repos: {
        address: addressRepo,
        transaction: transactionRepo,
        invoice: invoiceRepo,
        invoiceItem: invoiceItemRepo,
        manuscript: manuscriptRepo,
        waiver: waiverRepo,
        catalog: catalogRepo,
        payer: payerRepo,
        coupon: couponRepo,
      },
      services: { waiverService, emailService, vatService, logger },
    } = this;

    logger.setScope(`PhenomEvent:${SUBMISSION_QUALITY_CHECK_PASSED}`);
    logger.info('Incoming Event Data', data);

    const { submissionId, manuscripts } = data;

    if (manuscripts[0]?.articleType?.name in ManuscriptTypeNotInvoiceable) {
      return;
    }

    const maxVersion = manuscripts.reduce((max, m) => {
      const version = VersionCompare.versionCompare(m.version, max)
        ? m.version
        : max;
      return version;
    }, manuscripts[0].version);

    const {
      customId,
      title,
      articleType: { name },
      authors,
    } = manuscripts.find((m) => m.version === maxVersion);

    const { email, country, surname, givenNames } = authors.find(
      (a) => a.isCorresponding
    );

    const getTransactionUsecase = new GetTransactionDetailsByManuscriptCustomIdUsecase(
      invoiceItemRepo,
      transactionRepo,
      manuscriptRepo,
      invoiceRepo
    );

    const maybeTransaction = await getTransactionUsecase.execute(
      { customId },
      defaultContext
    );

    if (maybeTransaction.isLeft()) {
      logger.error(maybeTransaction.value.errorValue().message);
      throw maybeTransaction.value.error;
    }

    if (maybeTransaction.value.getValue().status !== TransactionStatus.DRAFT) {
      return;
    }

    const updateTransactionOnAcceptManuscript: UpdateTransactionOnAcceptManuscriptUsecase = new UpdateTransactionOnAcceptManuscriptUsecase(
      addressRepo,
      catalogRepo,
      transactionRepo,
      invoiceItemRepo,
      invoiceRepo,
      manuscriptRepo,
      waiverRepo,
      payerRepo,
      couponRepo,
      waiverService,
      emailService,
      vatService,
      logger
    );

    const result = await updateTransactionOnAcceptManuscript.execute(
      {
        manuscriptId: submissionId,
        customId,
        title,
        articleType: name,
        authorEmail: email,
        authorCountry: country,
        authorSurname: surname,
        authorFirstName: givenNames,
        bankTransferCopyReceiver:
          env.app.invoicePaymentEmailBankTransferCopyReceiver,
        emailSenderInfo: {
          address: env.app.invoicePaymentEmailSenderAddress,
          name: env.app.invoicePaymentEmailSenderName,
        },
        confirmationReminder: {
          delay: env.scheduler.confirmationReminderDelay,
          queueName: env.scheduler.emailRemindersQueue,
        },
      },
      defaultContext
    );

    if (result.isLeft()) {
      logger.error(result.value.errorValue().message);
      throw result.value.error;
    }
  },
};
