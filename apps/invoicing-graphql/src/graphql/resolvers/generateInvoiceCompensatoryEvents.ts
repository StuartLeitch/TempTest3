import {
  GenerateInvoiceCompensatoryEventsUsecase,
  GetInvoicesIdsUsecase,
} from '@hindawi/shared';

import { Context } from '../../builders';
import { Resolvers } from '../schema';

import { handleForbiddenUsecase, getAuthRoles } from './utils';

export const generateInvoiceCompensatoryEvents: Resolvers<Context> = {
  Mutation: {
    async generateInvoiceCompensatoryEvents(parent, args, context) {
      const roles = getAuthRoles(context);
      const { invoiceIds, journalIds } = args;
      const {
        repos: {
          paymentMethod,
          invoiceItem,
          manuscript,
          address,
          invoice,
          coupon,
          waiver,
          payer,
          payment,
        },
        services: { queue: sqsQueService },
        loggerBuilder,
      } = context;

      const loggerService = loggerBuilder.getLogger(
        GenerateInvoiceCompensatoryEventsUsecase.name
      );

      const usecaseContext = {
        roles,
      };

      const usecase = new GenerateInvoiceCompensatoryEventsUsecase(
        paymentMethod,
        invoiceItem,
        sqsQueService,
        manuscript,
        address,
        invoice,
        payment,
        coupon,
        waiver,
        payer,
        loggerService
      );
      const getIdsUsecase = new GetInvoicesIdsUsecase(invoice);
      const maybeResult = await getIdsUsecase.execute(
        {
          invoiceIds,
          journalIds,
          omitDeleted: true,
        },
        usecaseContext
      );

      if (maybeResult.isLeft()) {
        throw new Error(maybeResult.value.message);
      }

      const ids = maybeResult.value;

      const errors = [];

      for await (const invoiceId of ids) {
        const result = await usecase.execute({ invoiceId }, usecaseContext);

        handleForbiddenUsecase(result);

        if (result.isLeft()) {
          errors.push(result.value);
        }
      }

      if (errors.length) {
        console.error(errors);
        loggerService.error('Errors have ocurred', ...errors);
        throw errors;
      }

      loggerService.debug('Finish Regeneration');
      return 'ok';
    },
  },
};
