import { ArticlePublished } from '@hindawi/phenom-events';

import {
  UsecaseAuthorizationContext,
  ManuscriptTypeNotInvoiceable,
  EpicOnArticlePublishedUsecase,
  EpicOnArticlePublishedDTO,
  Roles,
} from '@hindawi/shared';

import { Context } from '../../builders';

import { EventHandler } from '../event-handler';

import { env } from '../../env';

const ARTICLE_PUBLISHED = 'ArticlePublished';

const defaultContext: UsecaseAuthorizationContext = {
  roles: [Roles.QUEUE_EVENT_HANDLER],
};

export const ArticlePublishedHandler: EventHandler<ArticlePublished> = {
  event: ARTICLE_PUBLISHED,
  handler(context: Context) {
    return async (data: ArticlePublished) => {
      const {
        repos: {
          invoice: invoiceRepo,
          invoiceItem: invoiceItemRepo,
          manuscript: manuscriptRepo,
          payer: payerRepo,
          address: addressRepo,
          coupon: couponRepo,
          waiver: waiverRepo,
          transaction: transactionRepo,
        },
        services: { emailService, vatService },
        loggerBuilder,
      } = context;

      const logger = loggerBuilder.getLogger(
        `PhenomEvent:${ARTICLE_PUBLISHED}`
      );
      logger.info(`Incoming Event Data`, data);

      const { customId, articleType, published } = data;

      if (articleType in ManuscriptTypeNotInvoiceable) {
        return;
      }

      const {
        sanctionedCountryNotificationReceiver,
        sanctionedCountryNotificationSender,
      } = env.app;

      const epicOnArticlePublishedUsecase = new EpicOnArticlePublishedUsecase(
        invoiceItemRepo,
        transactionRepo,
        manuscriptRepo,
        invoiceRepo,
        payerRepo,
        addressRepo,
        couponRepo,
        waiverRepo,
        emailService,
        vatService,
        logger
      );

      const args: EpicOnArticlePublishedDTO = {
        customId,
        published,
        sanctionedCountryNotificationReceiver,
        sanctionedCountryNotificationSender,
      };

      const result = await epicOnArticlePublishedUsecase.execute(
        args,
        defaultContext
      );

      if (result.isLeft()) {
        logger.error(result.value.message);
        throw result.value;
      }
    };
  },
};
