// * Core Domain
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';
import { UseCase } from '../../../../core/domain/UseCase';
import { Result, right, left } from '../../../../core/logic/Result';
import { AppError } from '../../../../core/logic/AppError';

import { Manuscript } from '../../domain/Manuscript';
import { ArticleId as ManuscriptId } from '../../domain/ArticleId';
import { ArticleRepoContract as ManuscriptRepoContract } from '../../repos/articleRepo';

import {
  Authorize,
  AccessControlledUsecase,
  AccessControlContext,
  CreateManuscriptAuthorizationContext
} from './createManuscriptAuthorizationContext';
import { CreateManuscriptDTO } from './createManuscriptDTO';
import { CreateManuscriptResponse } from './createManuscriptResponse';
import { CreateManuscriptErrors } from './createManuscriptErrors';

export class CreateManuscriptUsecase
  implements
    UseCase<
      CreateManuscriptDTO,
      Promise<CreateManuscriptResponse>,
      CreateManuscriptAuthorizationContext
    >,
    AccessControlledUsecase<
      CreateManuscriptDTO,
      CreateManuscriptAuthorizationContext,
      AccessControlContext
    > {
  constructor(private manuscriptRepo: ManuscriptRepoContract) {}

  private async getAccessControlContext(
    request: CreateManuscriptDTO,
    context?: CreateManuscriptAuthorizationContext
  ): Promise<AccessControlContext> {
    return {};
  }

  @Authorize('create:manuscript')
  public async execute(
    request: CreateManuscriptDTO,
    context?: CreateManuscriptAuthorizationContext
  ): Promise<CreateManuscriptResponse> {
    let manuscript: Manuscript;

    try {
      const manuscriptProps: CreateManuscriptDTO = request;

      // * System creates manuscript
      const manuscriptOrError = Manuscript.create(manuscriptProps);

      // This is where all the magic happens
      manuscript = manuscriptOrError.getValue();

      await this.manuscriptRepo.save(manuscript);

      return right(Result.ok<Manuscript>(manuscript));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}
