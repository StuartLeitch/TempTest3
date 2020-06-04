/* eslint-disable @nrwl/nx/enforce-module-boundaries */

import { ArticlePublished as ArticlePublishedEventPayload } from '@hindawi/phenom-events';
import {
  EpicOnArticlePublishedUsecase,
  EpicOnArticlePublishedDTO,
} from '../../../../../libs/shared/src/lib/modules/manuscripts/usecases/epicOnArticlePublished';
import { ManuscriptTypeNotInvoiceable } from './../../../../../libs/shared/src/lib/modules/manuscripts/domain/ManuscriptTypes';
import { CorrelationID } from '../../../../../libs/shared/src/lib/core/domain/CorrelationID';
import { env } from '../../env';

const ARTICLE_PUBLISHED = 'ArticlePublished';

export const ArticlePublishedHandler = {
  event: ARTICLE_PUBLISHED,
  async handler(data: ArticlePublishedEventPayload): Promise<void> {
    const {
      repos: {
        invoice: invoiceRepo,
        invoiceItem: invoiceItemRepo,
        manuscript: manuscriptRepo,
        payer: payerRepo,
        address: addressRepo,
        coupon: couponRepo,
        waiver: waiverRepo,
      },
      services: { emailService, vatService, logger },
    } = this;

    const correlationId = new CorrelationID().toString();

    logger.setScope(`PhenomEvent:${ARTICLE_PUBLISHED}`);
    logger.info(`Incoming Event Data`, { correlationId, data });

    const {
      customId,
      articleType: { name },
      published,
    } = data;

    if (name in ManuscriptTypeNotInvoiceable) {
      return;
    }

    const {
      sanctionedCountryNotificationReceiver,
      sanctionedCountryNotificationSender,
    } = env.app;

    const epicOnArticlePublishedUsecase = new EpicOnArticlePublishedUsecase(
      invoiceItemRepo,
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

    const result = await epicOnArticlePublishedUsecase.execute(args, {
      correlationId,
      roles: [],
    });

    if (result.isLeft()) {
      logger.error(result.value.errorValue().message, { correlationId });
      throw result.value.error;
    }
  },
};
