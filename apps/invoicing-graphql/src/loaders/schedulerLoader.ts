/* eslint-disable no-useless-catch */
/* eslint-disable no-inner-declarations */
/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  MicroframeworkLoader,
  MicroframeworkSettings,
} from 'microframework-w3tec';
import {
  setIntervalAsync,
  // clearIntervalAsync
} from 'set-interval-async/dynamic';

import { NoOpUseCase } from '../../../../libs/shared/src/lib/core/domain/NoOpUseCase';
import { RetryRevenueRecognitionNetsuiteErpInvoicesUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/ERP/retryRevenueRecognizedNetsuiteErpInvoices/retryRevenueRecognitionNetsuiteErpInvoices';
import { RetryRevenueRecognitionSageErpInvoicesUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/ERP/retryRevenueRecognizedSageErpInvoices/retryRevenueRecognitionSageErpInvoices';
import { RetryFailedNetsuiteErpInvoicesUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/ERP/retryFailedNetsuiteErpInvoices/retryFailedNetsuiteErpInvoices';
import { RetryFailedSageErpInvoicesUsecase } from '../../../../libs/shared/src/lib/modules/invoices/usecases/ERP/retryFailedSageErpInvoices/retryFailedSageErpInvoices';

import { env } from '../env';
import { Logger } from '../lib/logger';
import { Context } from '../builders';

const logger = new Logger();
logger.setScope('scheduler:loader');

export const schedulerLoader: MicroframeworkLoader = async (
  settings: MicroframeworkSettings | undefined
) => {
  if (settings) {
    const context: Context = settings.getData('context');
    const {
      repos: {
        invoiceItem,
        manuscript,
        publisher,
        address,
        catalog,
        invoice,
        coupon,
        waiver,
        payer,
      },
      services: { erp, logger: loggerService, vatService },
    } = context;
    const {
      failedErpCronRetryTimeMinutes,
      failedErpCronRetryDisabled,
      erpRegisterRevenueRecognitionEnabled,
    } = env.app;

    const retryFailedSageErpInvoicesUsecase = new RetryFailedSageErpInvoicesUsecase(
      invoice,
      invoiceItem,
      coupon,
      waiver,
      payer,
      address,
      manuscript,
      catalog,
      erp?.sage || null,
      publisher,
      loggerService,
      vatService
    );

    const retryFailedNetsuiteErpInvoicesUsecase = new RetryFailedNetsuiteErpInvoicesUsecase(
      invoice,
      invoiceItem,
      coupon,
      waiver,
      payer,
      address,
      manuscript,
      catalog,
      erp?.netsuite || null,
      publisher,
      loggerService,
      vatService
    );

    const retryRevenueRecognizedInvoicesToSageErpUsecase = erpRegisterRevenueRecognitionEnabled
      ? new RetryRevenueRecognitionSageErpInvoicesUsecase(
          invoice,
          invoiceItem,
          coupon,
          waiver,
          payer,
          address,
          manuscript,
          catalog,
          publisher,
          erp?.sage || null,
          loggerService
        )
      : new NoOpUseCase();

    const retryRevenueRecognizedInvoicesToNetsuiteErpUsecase = erpRegisterRevenueRecognitionEnabled
      ? new RetryRevenueRecognitionNetsuiteErpInvoicesUsecase(
          invoice,
          invoiceItem,
          coupon,
          waiver,
          payer,
          address,
          manuscript,
          catalog,
          publisher,
          erp?.netsuite || null,
          loggerService
        )
      : new NoOpUseCase();

    const sageJobQueue = [
      async function retryFailedSageErpInvoicesJob() {
        try {
          const maybeResponse = await retryFailedSageErpInvoicesUsecase.execute();
          const response = maybeResponse.value;
          if (maybeResponse.isLeft()) {
            // logger.error(response);
            throw response;
          }
        } catch (err) {
          throw err;
        }
      },
      async function retryRevenueRecognizedInvoicesToSageErpJob() {
        try {
          const response = await retryRevenueRecognizedInvoicesToSageErpUsecase.execute();
          if (response.isLeft()) {
            logger.error(response.value.errorValue().message);
            throw response.value.error;
          }
        } catch (err) {
          throw err;
        }
      },
    ];

    const netSuiteJobQueue = [
      // async function retryFailedNetsuiteErpInvoicesJob() {
      //   try {
      //     const maybeResponse = await retryFailedNetsuiteErpInvoicesUsecase.execute();
      //     const response = maybeResponse.value;
      //     if (maybeResponse.isLeft()) {
      //       // logger.error(response);
      //       throw response;
      //     }
      //   } catch (err) {
      //     throw err;
      //   }
      // },

      async function retryRevenueRecognizedInvoicesToNetsuiteErpJob() {
        try {
          const response = await retryRevenueRecognizedInvoicesToNetsuiteErpUsecase.execute();
          if (response.isLeft()) {
            logger.error(response.value.errorValue().message);
            throw response.value.error;
          }
        } catch (err) {
          throw err;
        }
      },
    ];

    // start scheduler
    const jobsQueue = [].concat(
      env.netSuite.netSuiteEnabled ? netSuiteJobQueue : []
      // env.salesForce.sageEnabled ? sageJobQueue : []
    );

    async function processJobsQueue() {
      // * clones the jobs queue
      let queue = [...jobsQueue];

      if (queue.length === 0) {
        return;
      }

      while (queue.length) {
        const head = queue[0];
        logger.debug('startProcessing', { job: head.name });
        try {
          await head();
        } catch (err) {
          logger.error('Job Error: ', err);
        }
        logger.debug('doneProcessing', { job: head.name });
        queue = queue.slice(1);
      }
    }

    if (!failedErpCronRetryDisabled) {
      setIntervalAsync(
        processJobsQueue,
        failedErpCronRetryTimeMinutes === 0
          ? 15000
          : failedErpCronRetryTimeMinutes * 60 * 1000
      );
    }
  }
};
