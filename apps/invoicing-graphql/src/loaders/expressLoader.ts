import KeycloakConnect, { Keycloak, Token } from 'keycloak-connect';
import express, { Express, Request, RequestHandler } from 'express';
import express_prom_bundle from 'express-prom-bundle';
import session, { Store } from 'express-session';
import { register } from 'prom-client';
import * as csv from '@fast-csv/parse';
import memorystore from 'memorystore';
import corsMiddleware from 'cors';
import { Parser } from 'json2csv';
import multer from 'multer';

import { MicroframeworkSettings, MicroframeworkLoader } from 'microframework-w3tec';

import {
  PayPalProcessFinishedUsecase,
  CatalogBulkUpdateUsecase,
  GetJournalListUsecase,
  GetInvoicePdfUsecase,
  GetRecentLogsUsecase,
  isAuthorizationError,
  executionContext,
  AuditLogMap,
  CatalogMap,
  Roles,
  left,
  CreateCouponUsecase,
  GenerateCouponCodeUsecase,
  DeleteBulkCouponsUsecase,
  AbstractApiExchangeRateService,
  LoggerBuilderContract,
  PdfGeneratorService,
  VATService,
  GetReceiptPdfUsecase,
} from '@hindawi/shared';

import { PayPalWebhookResponse, PayPalPaymentCapture } from '../services/paypal/types/webhooks';
import { Context, Repos } from '../builders';
import { env } from '../env';
import {
  CouponStatus,
  CouponType,
} from '../../../../libs/shared/src/lib/modules/coupons/domain/Coupon';

type JournalJson = {
  journalId?: string;
  apc?: string;
};

function extractRoles(req: Request): Array<Roles> {
  return (<any>req).kauth.grant.access_token.content.resource_access[env.app.keycloakConfig.resource].roles
    .map((role: string) => role.toUpperCase())
    .map((role: string) => Roles[role]);
}

function extractEmail(req: Request): string {
  return (<any>req).kauth.grant.access_token.content.email;
}

function extractCaptureId(data: PayPalPaymentCapture): string {
  const orderLink = data.links.find((link) => link.href.indexOf('captures') > -1 && link.href.indexOf('refund') === -1);
  const linkPathSplitted = orderLink.href.split('/');
  const orderId = linkPathSplitted[linkPathSplitted.length - 1];
  return orderId;
}

function parseCsvToJson<T>(path: string): Promise<Array<T>> {
  return new Promise((resolve, reject) => {
    const data = [];
    csv
      .parseFile(path, {
        headers: true,
        discardUnmappedColumns: true,
      })
      .on('error', reject)
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        resolve(data);
      });
  });
}

function configureKeycloak(app: Express, memoryStore: Store): Keycloak {
  const keycloakConfig = env.app.keycloakConfig;

  const keycloak = new KeycloakConnect(
    {
      store: memoryStore,
    },
    keycloakConfig
  );

  // Protect the main route for all graphql services
  // Disable unauthenticated access
  app.use(keycloak.middleware());

  return keycloak;
}

function protectMultiRole(...roles: Array<string>) {
  return (token: Token) => {
    const resp = roles
      .map((role) => role.toLowerCase())
      .map(token.hasRole, token)
      .reduce((acc, r) => acc || r, false);

    return resp;
  };
}

function getStore(maxAge: number) {
  const MemoryStore = memorystore(session);

  return new MemoryStore({
    checkPeriod: maxAge,
  });
}

export const expressLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
  if (settings) {
    const context: Context = settings.getData('context');

    const upload = multer({ dest: '/tmp' });

    const app = express();

    const maxAge = 1000 * 60 * 60 * 8;
    const store = getStore(maxAge);

    app.use(
      session({
        secret: env.app.sessionSecret,
        resave: false,
        saveUninitialized: true,
        store: store,
        cookie: { maxAge },
      })
    );

    const keycloak = configureKeycloak(app, store);
    settings.setData('keycloak', keycloak);

    const expressPrometheusMiddleware: RequestHandler = express_prom_bundle({
      buckets: [0.1, 0.4, 0.7, 1, 1.3, 2, 3],
      includeMethod: true,
      includePath: true,
      metricType: 'histogram',
      metricsPath: '/metrics',
      promRegistry: register,
      urlValueParser: {
        minHexLength: 5,
        extraMasks: [
          '^[0-9]+\\.[0-9]+\\.[0-9]+$', // replace dot-separated dates with #val
        ],
      },
    });

    app.use(expressPrometheusMiddleware);
    app.use(express.json());
    app.use(corsMiddleware());
    app.use(executionContext.expressMiddleware);

    app.get('/livez', async (req, res) => {
      res.set('Content-Type', 'application/json');
      res.status(200).send('{live: true}');
    });

    app.get('/readyz', async (req, res) => {
      res.set('Content-Type', 'application/json');
      res.status(200).send('{ready: true}');
    });

    app.get('/api/invoice/:payerId', async (req, res) => {
      const {
        repos,
        services: { exchangeRateService, pdfGenerator, vatService },
        loggerBuilder,
      } = context;

      const pdfEither = await generateInvoicePdf(
        loggerBuilder,
        repos,
        pdfGenerator,
        exchangeRateService,
        vatService,
        req
      );

      if (pdfEither.isLeft()) {
        return res.status(400).send(pdfEither.value.message);
      }

      const { fileName, file } = pdfEither.value;

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice_${fileName}`,
        'Content-Length': file.length,
      });

      res.end(file);
    });

    app.get('/api/receipt/:payerId', async (req, res) => {
      const {
        repos,
        services: { exchangeRateService, pdfGenerator, vatService },
        loggerBuilder,
      } = context;

      const pdfEither = await generateReceiptPdf(
        loggerBuilder,
        repos,
        pdfGenerator,
        exchangeRateService,
        vatService,
        req
      );

      if (pdfEither.isLeft()) {
        return res.status(400).send(pdfEither.value.message);
      }

      const { fileName, file } = pdfEither.value;

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=receipt_${fileName}`,
        'Content-Length': file.length,
      });

      res.end(file);
    });

    app.post('/api/payments/process-finished', async (req, res) => {
      // TODO: Add validation on event
      const data: PayPalWebhookResponse<PayPalPaymentCapture> = req.body;
      const {
        repos: { payment },
        loggerBuilder,
      } = context;

      const logger = loggerBuilder.getLogger('PayPalPaymentFinished');

      const authContext = { roles: [Roles.PAYER] };
      const usecase = new PayPalProcessFinishedUsecase(payment);
      const payPalOrderId = extractCaptureId(data.resource);

      logger.info(
        `Try to handle PayPal webhook for transaction finished, for transaction with foreignPaymentId on ${payPalOrderId}`
      );

      try {
        const result = await usecase.execute(
          {
            payPalEvent: data.event_type,
            payPalOrderId,
          },
          authContext
        );

        if (result.isLeft()) {
          logger.error(
            `Handling PayPal event finished with error ${result.value.message}. \nEvent had body {${JSON.stringify(
              req.body,
              null,
              2
            )}}`,
            result.value
          );
          console.error(
            `Handling PayPal event finished with error ${result.value.message}. \nEvent had body {${JSON.stringify(
              req.body,
              null,
              2
            )}}\n`,
            JSON.stringify(result.value, null, 2)
          );
          res.status(500);
        } else {
          res.status(200);
        }
      } catch (e) {
        logger.error(
          `While handling PayPal event an error ocurred {${e.message}}. \nEvent had body {${JSON.stringify(
            req.body,
            null,
            2
          )}}`,
          e
        );
        console.error(
          `While handling PayPal event an error ocurred {${e.message}}. \nEvent had body {${JSON.stringify(
            req.body,
            null,
            2
          )}}\n`,
          JSON.stringify(e, null, 2)
        );
        res.status(500);
      }

      res.send();
    });

    app.get('/api/logs', keycloak.protect(), async (req, res) => {
      const { repos } = context;
      const authContext = { roles: extractRoles(req) };
      const usecase = new GetRecentLogsUsecase(repos.audit);

      const fields = ['id', 'userAccount', 'timestamp', 'action', 'entity', 'item_reference', 'target'];
      const opts = { fields };
      const csvConverter = new Parser(opts);

      const listResponse = await usecase.execute(
        {
          pagination: { offset: 0, limit: 10 },
          filters: {
            startDate: new Date(String(req.query.startDate)).toISOString() ?? null,
            endDate: new Date(String(req.query.endDate)).toISOString() ?? null,
            download: req.query.download ?? 1,
          },
        },
        authContext
      );

      if (listResponse.isLeft()) {
        return left(listResponse.value);
      }

      const logs = listResponse.value.auditLogs.map(AuditLogMap.toPersistence);

      const jsonData = JSON.parse(JSON.stringify(logs));
      const csv = csvConverter.parse(jsonData);

      res.setHeader('Content-disposition', 'attachment; filename=logs.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csv);
    });

    app.get('/api/apc', keycloak.protect(), async (req, res) => {
      const { repos } = context;
      const authContext = { roles: extractRoles(req) };

      const usecase = new GetJournalListUsecase(repos.catalog);

      const fields = [
        'journalId',
        'journalTitle',
        { label: 'journalCode', value: 'code' },
        { label: 'apc', value: 'amount' },
        'zeroPriced',
      ];
      const opts = { fields };
      const csvConverter = new Parser(opts);

      const listResponse = await usecase.execute(
        {
          pagination: { offset: 0 },
        },
        authContext
      );

      if (listResponse.isLeft()) {
        return left(listResponse.value);
      }

      const logs = listResponse.value.catalogItems.map(CatalogMap.toPersistence);

      const jsonData = JSON.parse(JSON.stringify(logs));
      const csv = csvConverter.parse(jsonData);

      res.setHeader('Content-disposition', 'attachment; filename=apc.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csv);
    });

    app.post(
      '/api/coupons/multiple',
      upload.single('file'),
      keycloak.protect(
        protectMultiRole(
          Roles.ADMIN,
          Roles.SUPER_ADMIN,
          Roles.FINANCIAL_CONTROLLER,
          Roles.MARKETING
        )
      ),
      async (req, res) => {
        const { repos, loggerBuilder, auditLoggerServiceProvider } = context;
        const logger = loggerBuilder.getLogger('create-multiple-coupons');
        logger.info(
          `Received multiple coupon request for file: '${req.file.originalname}'`
        );
        const authContext = { roles: extractRoles(req) };

        const auditLoggerService = auditLoggerServiceProvider({
          email: extractEmail(req),
        });

        const createCouponUseCase = new CreateCouponUsecase(
          repos.coupon,
          auditLoggerService
        );

        const couponCodeGenerator = new GenerateCouponCodeUsecase(repos.coupon);
        const bulkCouponDelete = new DeleteBulkCouponsUsecase(repos.coupon);

        let generatedCodes: string[] = [];

        try {
          const jsonResult = await parseCsvToJson(req.file.path);

          if (jsonResult.length === 0) {
            logger.error(
              `The file you uploaded is empty: ${req.file.originalname}`
            );
            res
              .status(400)
              .send('The file you uploaded is empty or has invalid data.');
          }

          for (const element of jsonResult) {
            const maybeCouponCode = await couponCodeGenerator.execute(
              null,
              authContext
            );
            if (maybeCouponCode.isRight()) {
              element['CouponCode'] = maybeCouponCode.value.value;
            } else {
              return res.status(400).send(maybeCouponCode.value.message);
            }
            generatedCodes.push(element['CouponCode']);
            const maybeCreateCoupons = await createCouponUseCase.execute(
              {
                code: element['CouponCode'],
                status: req.body.status,
                expirationDate: req.body.expirationDate,
                type: CouponType.SINGLE_USE,
                invoiceItemType: 'APC',
                name: req.body.name,
                reduction: req.body.reduction,
              },
              authContext
            );

            if (maybeCreateCoupons.isLeft()) {
              return res.status(400).send(maybeCreateCoupons.value.message);
            }
          }

          const csvConverter = new Parser();
          const result = csvConverter.parse(jsonResult);
          res.setHeader(
            'Content-disposition',
            `attachment; filename=${req.file.filename}`
          );
          res.set('Content-Type', 'text/csv');
          res.status(200).send(result);
        } catch (error) {
          bulkCouponDelete.execute(
            { couponCodes: generatedCodes },
            authContext
          );
          logger.error(
            `An error while creating bulk coupons occurred {${
              error.message
            }}. \nEvent had body {${JSON.stringify(req.body, null, 2)}}`,
            error
          );
          res.status(500).send();
        }
      }
    );

    app.post(
      '/api/apc/upload-csv',
      upload.single('file'),
      keycloak.protect(protectMultiRole(Roles.FINANCIAL_CONTROLLER, Roles.SUPER_ADMIN, Roles.ADMIN)),
      async (req, res) => {
        const { repos, loggerBuilder, auditLoggerServiceProvider } = context;

        const logger = loggerBuilder.getLogger('upload-csv');

        const authContext = { roles: extractRoles(req) };

        const auditLoggerService = auditLoggerServiceProvider({
          email: extractEmail(req),
        });

        const usecase = new CatalogBulkUpdateUsecase(repos.catalog, auditLoggerService);

        if (!req.file) {
          return res.status(400).send('Please upload a file');
        }

        const jsonResult = await parseCsvToJson<JournalJson>(req.file.path);
        const newPrices = jsonResult.map((row) => ({
          journalId: row?.journalId,
          amount: row?.apc,
        }));

        try {
          const updatedList = await usecase.execute({ catalogItems: newPrices }, authContext);

          if (updatedList.isLeft()) {
            if (isAuthorizationError(updatedList.value)) {
              res.status(403);
              res.send(updatedList.value.message);
            }
            logger.error(`Error updating APC: ${updatedList.value.message}.`, updatedList.value);
            res.status(406).send(updatedList.value.message);
          } else {
            if (updatedList.value === 0) {
              res.status(204).send();
            }
            res.status(200).send();
          }
        } catch (err) {
          logger.error(`While handling APC Update event an error occurred {${err.message}}`);
          res.status(500).send();
        }
      }
    );

    // * Run application to listen on given port
    if (!env.isTest) {
      const server = app.listen(env.app.port);
      settings.setData('express_server', server);
    }

    // Here we can set the data for other loaders
    settings.setData('express_app', app);
  }
};

async function generateInvoicePdf(
  loggerBuilder: LoggerBuilderContract,
  repos: Repos,
  pdfGenerator: PdfGeneratorService,
  exchangeRateService: AbstractApiExchangeRateService,
  vatService: VATService,
  req
) {
  const logger = loggerBuilder.getLogger(GetInvoicePdfUsecase.name);

  const authContext = { roles: [Roles.PAYER] };

  const usecase = new GetInvoicePdfUsecase(
    repos.invoiceItem,
    repos.address,
    repos.manuscript,
    repos.invoice,
    repos.payer,
    repos.catalog,
    repos.coupon,
    repos.waiver,
    pdfGenerator,
    logger,
    exchangeRateService,
    vatService
  );
  const invoiceLink = req.headers.referer;
  logger.info(`Get Invoice pdf referer '${invoiceLink}'`);
  const pdfEither = await usecase.execute({ payerId: req.params.payerId, invoiceLink }, authContext);

  return pdfEither;
}

async function generateReceiptPdf(
  loggerBuilder: LoggerBuilderContract,
  repos: Repos,
  pdfGenerator: PdfGeneratorService,
  exchangeRateService: AbstractApiExchangeRateService,
  vatService: VATService,
  req
) {
  const logger = loggerBuilder.getLogger(GetReceiptPdfUsecase.name);

  const authContext = { roles: [Roles.PAYER] };

  const usecase = new GetReceiptPdfUsecase(
    repos.invoiceItem,
    repos.address,
    repos.manuscript,
    repos.invoice,
    repos.catalog,
    repos.payer,
    repos.payment,
    repos.coupon,
    repos.waiver,
    pdfGenerator,
    logger
  );

  const receiptLink = req.headers.referer;
  const pdfEither = await usecase.execute({ payerId: req.params.payerId, receiptLink }, authContext);

  return pdfEither;
}
