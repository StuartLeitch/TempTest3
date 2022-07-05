import {
  WithSopsSecretsServiceProps,
  ServiceType,
} from '@hindawi/phenom-charts';

const defaultValues: WithSopsSecretsServiceProps = {
  sopsSecrets: null,
  serviceProps: {
    image: {
      repository:
        '916437579680.dkr.ecr.eu-west-1.amazonaws.com/import-manuscript-validation',
      tag: 'latest',
    },
    replicaCount: 1,
    containerPort: 3000,
    labels: {
      owner: 'belzebuth',
      tier: 'backend',
    },
    livenessProbe: {
      path: '/livez'
    },
    readinessProbe: {
      path: '/readyz'

    },
    metrics: {
      scrape: true
    }

  },
};

export { defaultValues };
