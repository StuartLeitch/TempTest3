import AWS from 'aws-sdk';
import { Logger } from 'libs/shared/src/lib/infrastructure/logging/implementations/Logger';
import { defaultRegistry } from 'libs/shared/src/lib/modules/reporting/EventMappingRegistry';
import { FilterEventsService } from 'libs/shared/src/lib/modules/reporting/services/FilterEventsService';
import { SaveEventsUsecase } from 'libs/shared/src/lib/modules/reporting/usecases/saveEvents/saveEvents';
import { SaveSqsEventsUsecase } from 'libs/shared/src/lib/modules/reporting/usecases/saveSqsEvents/saveSqsEvents';
import {
  MicroframeworkLoader,
  MicroframeworkSettings,
} from 'microframework-w3tec';
import { KnexEventsRepo } from '../../../../libs/shared/src/lib/modules/reporting/repos/implementation/KnexEventsRepo';
import { env } from '../env';

export const contextLoader: MicroframeworkLoader = (
  settings: MicroframeworkSettings | undefined
) => {
  if (settings) {
    const db = settings.getData('connection');

    const repos = {
      eventsRepo: new KnexEventsRepo(db),
    };

    const registry = defaultRegistry;

    const config = {
      accessKeyId: env.aws.sqs.sqsAccessKey,
      secretAccessKey: env.aws.sqs.sqsSecretKey,
      region: env.aws.region,
      sqsEndpoint: env.aws.sqs.endpoint,
      queueName: env.aws.sqs.queueName,
      eventNamespace: env.app.eventNamespace,
      publisherName: env.app.publisherName,
      serviceName: env.app.name,
    };

    const s3 = new AWS.S3({
      credentials: {
        secretAccessKey: config.secretAccessKey,
        accessKeyId: config.accessKeyId,
      },
    });

    const sqs = new AWS.SQS({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      endpoint: config.sqsEndpoint,
      region: config.region,
    });

    const filterEventsService = new FilterEventsService(
      s3,
      new Logger('service:FilterEvents')
    );

    const services: ReportingServices = { s3, sqs, filterEventsService };

    const saveEventsUsecase = new SaveEventsUsecase(repos.eventsRepo, registry);
    const saveSqsEventsUsecase = new SaveSqsEventsUsecase(
      filterEventsService,
      saveEventsUsecase,
      new Logger('saveSqsEvents:usecase')
    );

    const usecases: ReportingUsecases = {
      saveEventsUsecase,
      saveSqsEventsUsecase,
    };

    const context = {
      repos,
      services,
      usecases,
    };

    settings.setData('context', context);
  }
};

interface ReportingUsecases {
  saveEventsUsecase: SaveEventsUsecase;
  saveSqsEventsUsecase: SaveSqsEventsUsecase;
}

interface ReportingServices {
  s3: AWS.S3;
  sqs: any; // AWS.SQS;
  filterEventsService: FilterEventsService;
}

export interface ReportingContext {
  services: ReportingServices;
  usecases: ReportingUsecases;
}
