import { WithSopsSecretsServiceProps } from '@hindawi/phenom-charts';
import { defaultValues } from '../../default';

const values: WithSopsSecretsServiceProps = {
  ...defaultValues,
  sopsSecrets: require('../../../config/prod.enc.json'),
  serviceProps: {
    ...defaultValues.serviceProps,
    envVars: {
      ...defaultValues.serviceProps.envVars,
    },
    ingressOptions: {
      rules: [
        {
          host: 'import-manuscript.prod.phenom.pub',
        },
      ],
    },
  },
};

export { values };
