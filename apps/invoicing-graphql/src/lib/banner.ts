import { LoggerContract } from '@hindawi/shared';
import { env } from '../env';

export function banner(log: LoggerContract): void {
  if (env.app.banner) {
    const route = () => `${env.app.schema}://${env.app.host}:${env.app.port}`;

    log.info(`Environment  : ${env.node}`);
    log.info(`Version      : ${env.app.version}`);
    log.info(`API Info     : ${route()}${env.app.routePrefix}`);
    if (env.graphql.enabled) {
      log.info(`GraphQL      : ${env.graphql.enabled}`);
    }
  } else {
    log.debug(`Application is up and running.`);
  }
}
