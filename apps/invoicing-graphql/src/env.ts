// import * as path from 'path';
import 'config';

import * as pkg from '../../../package.json';
import {
  getOsEnvWithDefault,
  getOsEnvOptional,
  normalizePort,
  getOsPath,
  getOsEnv,
  toNumber,
  toArray,
  toFloat,
  toBool
  // getOsPaths,
} from './lib/env';

/**
 * Load .env file or for tests the .env.test file.
 */
// dotenv.config({
//   path: path.join(
//     process.cwd(),
//     `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`
//   )
// });

/**
 * Environment variables
 */
export const env = {
  node: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  app: {
    name: getOsEnv('SERVICE_NAME'),
    version: (pkg as any).version,
    description: (pkg as any).description,
    host: getOsEnv('APP_HOST'),
    schema: getOsEnv('APP_SCHEMA'),
    routePrefix: getOsEnv('APP_ROUTE_PREFIX'),
    FERoot: getOsEnv('FE_ROOT'),
    eventNamespace: getOsEnv('EVENT_NAMESPACE'),
    publisherName: getOsEnv('PUBLISHER_NAME'),
    vatValidationServiceEndpoint: getOsEnv('VAT_VALIDATION_SERVICE_ENDPOINT'),
    failedErpCronRetryTimeMinutes: toNumber(
      getOsEnv('FAILED_ERP_CRON_RETRY_TIME_MINUTES')
    ),
    failedErpCronRetryDisabled: toBool(
      getOsEnv('FAILED_ERP_CRON_RETRY_DISABLED')
    ),
    mailingDisabled: toBool(getOsEnv('MAILING_DISABLED')),
    port: normalizePort(process.env.PORT || getOsEnv('APP_PORT')),
    banner: toBool(getOsEnv('APP_BANNER')),
    dirs: {
      migrationsDir: getOsPath('DB_MIGRATIONS_DIR'),
      seedsDir: getOsPath('DB_SEEDS_DIR')
    },
    sanctionedCountryNotificationReceiver: getOsEnv(
      'SANCTIONED_COUNTRY_NOTIFICATION_RECEIVER'
    ),
    sanctionedCountryNotificationSender: getOsEnv(
      'SANCTIONED_COUNTRY_NOTIFICATION_SENDER'
    ),
    invoicePaymentEmailBankTransferCopyReceiver: getOsEnv(
      'INVOICE_PAYMENT_EMAIL_BANK_TRANSFER_COPY_RECEIVER'
    ),
    invoicePaymentEmailSenderAddress: getOsEnv(
      'INVOICE_PAYMENT_EMAIL_SENDER_ADDRESS'
    ),
    invoicePaymentEmailSenderName: getOsEnv('INVOICE_PAYMENT_EMAIL_SENDER_NAME')
  },
  log: {
    tenant: getOsEnv('LOG_TENANT'),
    level: getOsEnv('LOG_LEVEL'),
    json: toBool(getOsEnvOptional('LOG_JSON')),
    output: getOsEnv('LOG_OUTPUT'),
    cloudwatch: {
      region: getOsEnv('LOG_CLOUDWATCH_REGION'),
      groupName: getOsEnv('LOG_CLOUDWATCH_GROUP_NAME'),
      accessKey: getOsEnv('LOG_CLOUDWATCH_ACCESS_KEY'),
      secretAccessKey: getOsEnv('LOG_CLOUDWATCH_SECRET_ACCESS_KEY')
    }
  },
  db: {
    host: getOsEnvOptional('DB_HOST'),
    username: getOsEnvOptional('DB_USERNAME'),
    password: getOsEnvOptional('DB_PASSWORD'),
    database: getOsEnv('DB_DATABASE'),
    logging: getOsEnv('DB_LOGGING')
  },
  graphql: {
    enabled: toBool(getOsEnv('GRAPHQL_ENABLED')),
    route: getOsEnv('GRAPHQL_ROUTE'),
    editor: toBool(getOsEnv('GRAPHQL_EDITOR'))
  },
  monitor: {
    enabled: toBool(getOsEnv('MONITOR_ENABLED')),
    route: getOsEnv('MONITOR_ROUTE'),
    username: getOsEnv('MONITOR_USERNAME'),
    password: getOsEnv('MONITOR_PASSWORD')
  },
  aws: {
    enabled: toBool(getOsEnv('AWS_ENABLED')),
    ses: {
      region: getOsEnv('AWS_SES_REGION'),
      accessKey: getOsEnv('AWS_SES_ACCESS_KEY'),
      secretKey: getOsEnv('AWS_SES_SECRET_KEY')
    },
    sns: {
      topic: getOsEnv('AWS_SNS_TOPIC'),
      endpoint: getOsEnv('AWS_SNS_ENDPOINT'),
      sqsRegion: getOsEnv('AWS_SNS_SQS_REGION'),
      sqsAccessKey: getOsEnv('AWS_SNS_SQS_ACCESS_KEY'),
      sqsSecretKey: getOsEnv('AWS_SNS_SQS_SECRET_KEY')
    },
    sqs: {
      queueName: getOsEnv('AWS_SQS_QUEUE_NAME'),
      endpoint: getOsEnv('AWS_SQS_ENDPOINT')
    },
    s3: {
      largeEventBucket: getOsEnv('PHENOM_LARGE_EVENTS_BUCKET')
    }
  },
  scheduler: {
    db: {
      port: toNumber(getOsEnv('SCHEDULER_DB_PORT')),
      password: getOsEnv('SCHEDULER_DB_PASSWORD'),
      host: getOsEnv('SCHEDULER_DB_HOST')
    },
    // notificationsQueues: getOsEnvArray('NOTIFICATIONS_QUEUES'),
    notificationsQueues: toArray(
      getOsEnvWithDefault('NOTIFICATIONS_QUEUES', 'email-reminders')
    ),
    emailRemindersQueue: getOsEnvWithDefault(
      'EMAIL_REMINDERS_QUEUE',
      'email-reminders'
    ),
    confirmationReminderDelay: toFloat(
      getOsEnvWithDefault('CONFIRMATION_REMINDER_DELAY_DAYS', '5')
    ),
    paymentReminderDelay: toFloat(getOsEnv('PAYMENT_REMINDER_DELAY_DAYS')),
    creditControlReminderDelay: toFloat(
      getOsEnv('CREDIT_CONTROL_REMINDER_DELAY_DAYS')
    )
  },
  braintree: {
    merchantAccountId: getOsEnv('BT_MERCHANT_ACCOUNT_ID'),
    tokenizationKey: getOsEnv('BT_TOKENIZATION_KEY'),
    environment: getOsEnv('BT_ENVIRONMENT'),
    merchantId: getOsEnv('BT_MERCHANT_ID'),
    privateKey: getOsEnv('BT_PRIVATE_KEY'),
    publicKey: getOsEnv('BT_PUBLIC_KEY')
  },
  paypal: {
    environment: getOsEnv('PP_ENVIRONMENT'),
    clientId: getOsEnv('PP_CLIENT_ID'),
    clientSecret: getOsEnv('PP_CLIENT_SECRET')
  },
  salesForce: {
    loginUrl: getOsEnv('SAGE_LOGIN_URL'),
    user: getOsEnv('SAGE_USER'),
    password: getOsEnv('SAGE_PASSWORD'),
    securityToken: getOsEnv('SAGE_SECURITY_TOKEN')
  },
  migration: {
    token: getOsEnv('MIGRATION_TOKEN')
  }
};
