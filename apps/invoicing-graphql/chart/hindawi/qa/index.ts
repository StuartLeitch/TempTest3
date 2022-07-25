import {
  WithSopsSecretsServiceProps,
  ConfigurationMountType,
  IngressOptionsSpec,
} from '@hindawi/phenom-charts';
import { defaultValues } from '../../default';

const values: WithSopsSecretsServiceProps = {
  ...defaultValues,
  sopsSecrets: require('../../../config/qa.enc.json'),
  serviceProps: {
    ...defaultValues.serviceProps,
    envVars: {
      ...defaultValues.serviceProps.envVars,
      SCHEDULER_DB_HOST: 'sisif-redis-master',
    },
    secrets: {
      ['sisif-redis']: {
        as: ConfigurationMountType.ENV,
        items: {
          'redis-password': 'SCHEDULER_DB_PASSWORD',
        },
      },
    },
    ingressOptions: {
      rules: [
        {
          host: 'invoicing-graphql.qa.phenom.pub',
        },
      ],
    },
  },
};

export { values };
