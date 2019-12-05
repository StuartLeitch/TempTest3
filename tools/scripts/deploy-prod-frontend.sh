#!/bin/sh

APP="invoicing-web"
TO="${AWS_ENVIRONMENT}-${APP}"

printf -- "Build FrontEnd App for ${AWS_ENVIRONMENT} environment"
npm run build invoicing-web --configuration=production

printf -- "Dockerize FrontEnd App for ${AWS_ENVIRONMENT} environment"
APP=$APP TO=$TO AWS_ENVIRONMENT=$AWS_ENVIRONMENT AWS_REGISTRY=$AWS_REGISTRY CI_COMMIT_SHA=$CI_COMMIT_SHA ./tools/scripts/dockerize-local.sh

printf -- "Deploy FrontEnd App for ${AWS_ENVIRONMENT} environment"
aws --profile=production elasticbeanstalk update-environment --environment-name $AWS_ENVIRONMENT-invoicing-web --version-label $AWS_ENVIRONMENT-invoicing-web