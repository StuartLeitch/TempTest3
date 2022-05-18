import { ApolloKeycloakAuthUtils } from '@hindawi/shared';
import {
  CreateManuscriptUploadUrlUseCase,
  ConfirmManuscriptUploadUseCase,
  Roles,
} from '@hindawi/import-manuscript-commons';

import { Context } from '../../builders';
import { Resolvers } from '../schema';

import { env } from '../../env';

const utils = new ApolloKeycloakAuthUtils<Context, Roles>(
  env.app.keycloakClientId,
  Roles
);

export const s3Upload: Resolvers<Context> = {
  Mutation: {
    async confirmS3Upload(parent, args, context) {
      const { fileName }: { fileName: string } = args.confirmation;

      const contextRoles = utils.getAuthRoles(context);
      const useCaseContext = {
        roles: contextRoles,
      };

      const email = context.keycloakAuth.accessToken['content']['email'];

      const { services, repos, loggerBuilder } = context;
      try {
        const confirmManuscriptUploadUseCase =
          new ConfirmManuscriptUploadUseCase(
            repos.manuscriptInfoRepo,
            services.uploadService,
            services.queueService,
            loggerBuilder.getLogger(ConfirmManuscriptUploadUseCase.name)
          );
        const response = await confirmManuscriptUploadUseCase.execute(
          { fileName, failsEmail: email, successEmail: email },
          useCaseContext
        );

        utils.handleForbiddenUsecase(response);

        if (response.isLeft()) {
          throw new Error(response.value.message);
        }

        return true;
      } catch (err) {
        loggerBuilder.getLogger('confirmS3Upload').error(err);
        throw err;
      }
    },
  },

  Query: {
    async createSignedUrlForS3Upload(parent, args, context): Promise<string> {
      const fileName: string = args.fileName;

      const contextRoles = utils.getAuthRoles(context);
      const useCaseContext = {
        roles: contextRoles,
      };

      const { services, repos, loggerBuilder } = context;

      try {
        const createManuscriptUploadUrlUseCase =
          new CreateManuscriptUploadUrlUseCase(
            services.uploadService,
            repos.manuscriptInfoRepo,
            loggerBuilder.getLogger(CreateManuscriptUploadUrlUseCase.name)
          );
        const response = await createManuscriptUploadUrlUseCase.execute(
          { fileName },
          useCaseContext
        );

        utils.handleForbiddenUsecase(response);

        if (response.isLeft()) {
          throw new Error(response.value.message);
        }

        return response.value;
      } catch (err) {
        loggerBuilder.getLogger('createSignedUrlForS3Upload').error(err);
        throw err;
      }
    },
  },
};
