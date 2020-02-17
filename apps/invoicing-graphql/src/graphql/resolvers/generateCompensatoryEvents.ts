import {
  GenerateCompensatoryEventsUsecase,
  GetInvoicesIdsUsecase
} from '@hindawi/shared';

import { Resolvers } from '../schema';

import { env } from '../../env';

export const generateCompensatoryEvents: Resolvers<any> = {
  Mutation: {
    async generateCompensatoryEvents(parent, args, context) {
      const { invoiceIds, journalIds } = args;
      const {
        repos: {
          invoiceItem,
          manuscript,
          address,
          invoice,
          coupon,
          waiver,
          payer
        },
        qq: sqsQueService
      } = context;
      const usecase = new GenerateCompensatoryEventsUsecase(
        invoiceItem,
        sqsQueService,
        manuscript,
        address,
        invoice,
        coupon,
        waiver,
        payer
      );
      const getIdsUsecase = new GetInvoicesIdsUsecase(invoice);
      const maybeResult = await getIdsUsecase.execute({
        invoiceIds,
        journalIds
      });

      if (maybeResult.isLeft()) {
        throw new Error(maybeResult.value.errorValue().message);
      }

      const ids = maybeResult.value.getValue();

      for await (const invoiceId of ids) {
        const result = await usecase.execute({ invoiceId });
        if (result.isLeft()) {
          throw new Error(result.value.errorValue().message);
        }
      }

      return 'ok';
    }
  }
};
