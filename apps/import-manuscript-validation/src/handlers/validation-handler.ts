import {
  ExtractManuscriptMetadataUseCase,
  SubmitManuscriptUseCase,
  UnarchivePackageUsecase,
  ValidatePackageUseCase,
  ValidatePackageEvent,
  ManuscriptMapper,
} from '@hindawi/import-manuscript-commons';

import { EventHandler } from './event-handler';
import { Context } from '../builders';

import { env } from '../env';

const VALIDATE_PACKAGE = 'ValidatePackage';

export const ValidatePackageHandler: EventHandler<ValidatePackageEvent> = {
  event: VALIDATE_PACKAGE,
  handler(context: Context) {
    return async (data: ValidatePackageEvent) => {
      /*
        example of how the event looks on SQS:
        {
          "event": "ValidatePackage",
          "data": {
            "successContactEmail": "rares.stan@hindawi.com",
            "failContactEmail": "rares.stan@hindawi.com",
            "fileName": "test-bucket.zip"
          }
        }

        the data field contains the message that the handlers will receive, in this case this handler will receive the payload:

        {
          "successContactEmail": "rares.stan@hindawi.com",
          "failContactEmail": "rares.stan@hindawi.com",
          "fileName": "test-bucket.zip"
        }
      */

      const {
        services: {
          objectStoreService,
          archiveService,
          xmlService,
          reviewClient,
        },
        loggerBuilder,
      } = context;

      const logger = loggerBuilder.getLogger('validation-handler');

      const usecase = new UnarchivePackageUsecase(
        objectStoreService,
        archiveService
      );

      const res = await usecase.execute({
        saveLocation: env.zip.saveLocation,
        name: data.fileName,
      });

      if (res.isLeft()) {
        throw res.value;
      }

      logger.debug(`Package ${res.value.src} extracted`);
      const validateUsecase = new ValidatePackageUseCase(xmlService, logger);
      const extractManuscriptMetadataUseCase =
        new ExtractManuscriptMetadataUseCase(xmlService, loggerBuilder);

      try {
        await validateUsecase.execute({
          definitionsPath: env.app.xmlDefinitionsLocation,
          packagePath: res.value.src,
        });

        logger.debug(`Package ${res.value.src} validated`);

        const manuscript = await extractManuscriptMetadataUseCase.execute({
          definitionsPath: env.app.xmlDefinitionsLocation,
          packagePath: res.value.src,
        });

        logger.info(
          JSON.stringify(ManuscriptMapper.toPersistance(manuscript), null, 2)
        );

        const submissionEditURL = await new SubmitManuscriptUseCase(
          reviewClient,
          env.app.reviewAppBasePath,
          env.app.supportedArticleTypes,
          env.app.mecaArticleTypes,
          loggerBuilder
        ).execute({ manuscript, packagePath: res.value.src });
        logger.info(`Submission url ${submissionEditURL}`);

        context.services.emailService
          .createSuccesfulValidationNotification(
            data.fileName,
            env.app.validationSenderEmail,
            {
              name: data.receiverName,
              email: data.successContactEmail,
            },
            manuscript.title,
            submissionEditURL
          )
          .sendEmail();
      } catch (err) {
        // rejection email here
        context.services.emailService
          .createUnsuccesfulValidationNotification(
            data.fileName,
            env.app.validationSenderEmail,
            {
              name: data.receiverName,
              email: data.failContactEmail,
            },
            err,
            env.app.importManuscriptAppBasePath
          )
          .sendEmail();
        logger.error(err);
        throw err;
      }
    };
  },
};
