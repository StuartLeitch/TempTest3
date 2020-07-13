import 'reflect-metadata';
import { bootstrapMicroframework } from 'microframework-w3tec';

import { banner } from './lib/banner';
import { Logger } from './lib/logger';
import './lib/logger/LoggerAspect';

import { env } from './env';

/**
 * EXPRESS TYPESCRIPT BOILERPLATE
 * ----------------------------------------
 *
 * This is a boilerplate for Node.js Application written in TypeScript.
 * The basic layer of this app is express. For further information visit
 * the 'README.md' file.
 */
const log = new Logger();

async function main() {
  /**
   * Loaders
   */
  const loaders = [
    // winstonLoader,
    // knexLoader,
    // contextLoader,
    // expressLoader,
    // monitorLoader,
    // graphqlLoader,
    // queueServiceLoader,
    // schedulerLoader,
    // domainEventsRegisterLoader,
    // sisifLoader,
    // erpLoader,
  ];

  if (env.loaders.winstonEnabled) {
    const { winstonLoader } = await import(
      /* webpackChunkName: "winstonLoader" */ './loaders/winstonLoader'
    );
    log.info('Winston logging initiated ✔️');
    loaders.push(winstonLoader);
  }

  if (env.loaders.knexEnabled) {
    const { knexLoader } = await import(
      /* webpackChunkName: "knexLoader" */ './loaders/knexLoader'
    );
    log.info('Knex Query Builder initiated ✔️');
    loaders.push(knexLoader);
  }

  if (env.loaders.contextEnabled) {
    const { contextLoader } = await import(
      /* webpackChunkName: "contextLoader" */ './loaders/contextLoader'
    );
    log.info('Context state object initiated ✔️');
    loaders.push(contextLoader);
  }

  if (env.loaders.expressEnabled) {
    const { expressLoader } = await import(
      /* webpackChunkName: "expressLoader" */ './loaders/expressLoader'
    );
    log.info('Express Server initiated ✔️');
    loaders.push(expressLoader);
  }

  if (env.loaders.monitorEnabled) {
    const { monitorLoader } = await import(
      /* webpackChunkName: "monitorLoader" */ './loaders/monitorLoader'
    );
    log.info('Express Monitor initiated ✔️');
    loaders.push(monitorLoader);
  }

  if (env.loaders.graphqlEnabled) {
    const { graphqlLoader } = await import(
      /* webpackChunkName: "graphqlLoader" */ './loaders/graphqlLoader'
    );
    log.info('GraphQL Server initiated ✔️');
    loaders.push(graphqlLoader);
  }

  if (env.loaders.erpEnabled) {
    const { erpLoader } = await import(
      /* webpackChunkName: "erpLoader" */ './loaders/erpLoader'
    );
    log.info('ERP Sage integration initiated ✔️');
    loaders.push(erpLoader);
  }

  if (env.loaders.queueServiceEnabled) {
    const { queueServiceLoader } = await import(
      /* webpackChunkName: "queueServiceLoader" */ './loaders/queueServiceLoader'
    );
    log.info('Queue Service initiated ✔️');
    loaders.push(queueServiceLoader);
  }

  // import { schedulerLoader } from './loaders/schedulerLoader';
  if (env.loaders.domainEventsRegisterEnabled) {
    // import { domainEventsRegisterLoader } from './loaders/domainEventsLoader';
    const { domainEventsRegisterLoader } = await import(
      /* webpackChunkName: "domainEventsRegisterLoader" */ './loaders/domainEventsLoader'
    );
    log.info('Domain Events initiated ✔️');
    loaders.push(domainEventsRegisterLoader);
  }
  // import { sisifLoader } from './loaders/sisifLoader';

  await bootstrapMicroframework({
    /**
     * Loader is a place where you can configure all your modules during microframework
     * bootstrap process. All loaders are executed one by one in a sequential order.
     */
    loaders,
  })
    .then(() => banner(log))
    .catch((error) => {
      log.error('Application crashed', error);
      process.exit(1);
    });
}

main();
