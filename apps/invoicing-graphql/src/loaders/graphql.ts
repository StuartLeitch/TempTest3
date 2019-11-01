import * as path from 'path';
import * as express from 'express';
import GraphQLHTTP from 'express-graphql';
import {
  MicroframeworkLoader,
  MicroframeworkSettings
} from 'microframework-w3tec';
import {buildSchema} from 'type-graphql';
import Container from 'typedi';

import {environment} from '../environments/environment';
import {getErrorCode, getErrorMessage, handlingErrors} from '../lib/graphql';
import { InvoiceResolver } from './../api/resolvers/invoiceResolver';

export const graphqlLoader: MicroframeworkLoader = async (
  settings: MicroframeworkSettings | undefined
) => {
  if (settings && environment.graphql.enabled) {
    const expressApp = settings.getData('express_app');

    const schema = await buildSchema({
      resolvers: [InvoiceResolver],
      // automatically create `schema.gql` file with schema definition in current folder
      emitSchemaFile: path.resolve(__dirname, '../src/api', 'schema.graphql')
    });

    handlingErrors(schema);

    // Add graphql layer to the express app
    expressApp.use(
      environment.graphql.route,
      (request: express.Request, response: express.Response) => {
        // Build GraphQLContext
        const requestId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER); // uuid-like
        const container = Container.of(requestId); // get scoped container
        const context = {requestId, container, request, response}; // create our context
        container.set('context', context); // place context or other data in container

        // Setup GraphQL Server
        GraphQLHTTP({
          schema,
          context,
          graphiql: environment.graphql.editor,
          formatError: error => ({
            code: getErrorCode(error.message),
            message: getErrorMessage(error.message),
            path: error.path
          })
        })(request, response);
      }
    );
  }
};
