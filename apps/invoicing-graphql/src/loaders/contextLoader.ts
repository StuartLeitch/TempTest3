/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  MicroframeworkSettings,
  MicroframeworkLoader,
} from 'microframework-w3tec';

import { LoggerBuilder } from '@hindawi/shared';

import { buildServices, buildRepos, Context } from '../builders';

export const contextLoader: MicroframeworkLoader = async (
  settings: MicroframeworkSettings | undefined
) => {
  if (settings) {
    const db = settings.getData('connection');
    const loggerBuilder = new LoggerBuilder();

    const repos = buildRepos(db, loggerBuilder);
    const services = await buildServices(repos, loggerBuilder);

    const context: Context = {
      services,
      repos,
    };

    settings.setData('context', context);
  }
};
