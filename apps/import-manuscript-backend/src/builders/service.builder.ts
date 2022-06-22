import { SqsEventProducer } from '@hindawi/queue-utils';
import {
  UploadServiceContract,
  S3UploadService,
} from '@hindawi/import-manuscript-commons';

import { env } from '../env';

export interface Services {
  uploadService: UploadServiceContract;
  queueService: SqsEventProducer;
}
export async function buildServices(): Promise<Services> {
  const s3Configuration = {
    region: env.aws.region,
    accessKeyId: env.aws.accessKey,
    secretAccessKey: env.aws.secretKey,
    bucketName: env.aws.s3.zipBucket,
    signedUrlExpirationInSeconds: parseFloat(
      env.aws.s3.signedUrlExpirationInSeconds
    ),
  };

  const sqsService = new SqsEventProducer(
    env.aws.sqs.queueName,
    env.aws.sqs.eventNamespace,
    env.aws.sqs.publisherName,
    env.app.name,
    env.aws.region,
    {},
    env.aws.sqs.endpoint,
    env.aws.accessKey,
    env.aws.secretKey
  );
  await sqsService.start();

  const s3UploadService = new S3UploadService(s3Configuration);

  const services: Services = {
    uploadService: s3UploadService,
    queueService: sqsService,
  };
  return services;
}
