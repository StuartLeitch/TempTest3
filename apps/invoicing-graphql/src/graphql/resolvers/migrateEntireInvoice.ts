import {
  MigrateEntireInvoiceDTO,
  MigrateEntireInvoiceUsecase
} from '@hindawi/shared';

import { Resolvers } from '../schema';

import { env } from '../../env';

export const migrateEntireInvoice: Resolvers<any> = {
  Mutation: {
    async migrateEntireInvoice(parent, args, context) {
      const {
        repos: {
          paymentMethod,
          invoiceItem,
          transaction,
          manuscript,
          address,
          invoice,
          payment,
          coupon,
          waiver,
          payer
        },
        qq: sqsQueService
      } = context;

      const migrateUsecase = new MigrateEntireInvoiceUsecase(
        paymentMethod,
        sqsQueService,
        invoiceItem,
        transaction,
        manuscript,
        address,
        invoice,
        payment,
        coupon,
        waiver,
        payer
      );

      const usecaseRequest: MigrateEntireInvoiceDTO = {
        acceptanceDate: args.acceptanceDate,
        submissionDate: args.submissionDate,
        paymentDate: args.paymentDate,
        issueDate: args.issueDate,
        erpReference: args.erpReference,
        invoiceId: args.invoiceId,
        payer: args.payer,
        apc: args.apc
      };

      if (args.token !== env.migration.token) {
        console.log('invalid token');
        return null;
      }

      const maybeResult = await migrateUsecase.execute(usecaseRequest);

      if (maybeResult.isLeft()) {
        console.log(maybeResult.value);
        throw new Error(maybeResult.value.errorValue().message);
      }

      return 'migration ok';
    }
  }
};
