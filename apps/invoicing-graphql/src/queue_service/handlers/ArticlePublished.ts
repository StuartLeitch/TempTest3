/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { ArticlePublished as ArticlePublishedEventPayload } from '@hindawi/phenom-events';
import {
  EpicOnArticlePublishedUsecase,
  EpicOnArticlePublishedDTO,
} from '../../../../../libs/shared/src/lib/modules/manuscripts/usecases/epicOnArticlePublished';
import { ManuscriptTypeNotInvoiceable } from './../../../../../libs/shared/src/lib/modules/manuscripts/domain/ManuscriptTypes';
import { CorrelationID } from '../../../../../libs/shared/src/lib/core/domain/CorrelationID';
import { Logger } from '../../lib/logger';
import { env } from '../../env';

const ARTICLE_PUBLISHED = 'ArticlePublished';
const logger = new Logger(`PhenomEvent:${ARTICLE_PUBLISHED}`);

export const ArticlePublishedHandler = {
  event: ARTICLE_PUBLISHED,
  async handler(data: ArticlePublishedEventPayload) {
    const correlationId = new CorrelationID().toString();
    logger.info(`Incoming Event Data`, { correlationId, data });

    const {
      customId,
      articleType: { name },
      // journalId,
      published,
      // title
    } = data;

    if (name in ManuscriptTypeNotInvoiceable) {
      return;
    }

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
      services: { emailService, vatService, logger: loggerService },
    } = this;
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
      loggerService
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
