// * Core Domain
import { UniqueEntityID } from '../../../../core/domain/UniqueEntityID';
import { UseCase } from '../../../../core/domain/UseCase';
import { Result, right, left } from '../../../../core/logic/Result';
import { AppError } from '../../../../core/logic/AppError';

import { Manuscript } from '../../domain/Manuscript';
import { ManuscriptId } from '../../../invoices/domain/ManuscriptId';
import { ArticleRepoContract as ManuscriptRepoContract } from '../../repos/articleRepo';

import {
  Authorize,
  AccessControlledUsecase,
  AccessControlContext,
  GetManuscriptByManuscriptIdAuthorizationContext
} from './getManuscriptAuthorizationContext';
import { GetManuscriptByManuscriptIdDTO } from './getManuscriptByManuscriptIdDTO';
import { GetManuscriptByManuscriptIdResponse } from './getManuscriptByManuscriptIdResponse';
import { GetManuscriptByManuscriptIdErrors } from './getManuscriptByManuscriptIdErrors';

export class GetManuscriptByManuscriptIdUsecase
  implements
    UseCase<
      GetManuscriptByManuscriptIdDTO,
      Promise<GetManuscriptByManuscriptIdResponse>,
      GetManuscriptByManuscriptIdAuthorizationContext
    >,
    AccessControlledUsecase<
      GetManuscriptByManuscriptIdDTO,
      GetManuscriptByManuscriptIdAuthorizationContext,
      AccessControlContext
    > {
  constructor(private manuscriptRepo: ManuscriptRepoContract) {}

  private async getAccessControlContext(
    request: GetManuscriptByManuscriptIdDTO,
    context?: GetManuscriptByManuscriptIdAuthorizationContext
  ): Promise<AccessControlContext> {
    return {};
  }

  @Authorize('read:manuscript')
  public async execute(
    request: GetManuscriptByManuscriptIdDTO,
    context?: GetManuscriptByManuscriptIdAuthorizationContext
  ): Promise<GetManuscriptByManuscriptIdResponse> {
    let manuscript: Manuscript;

    const manuscriptId = ManuscriptId.create(
      new UniqueEntityID(request.manuscriptId)
    ).getValue();

    try {
      try {
        manuscript = await this.manuscriptRepo.findById(manuscriptId);
      } catch (e) {
        return left(
          new GetManuscriptByManuscriptIdErrors.ManuscriptFoundError(
            manuscriptId.id.toString()
          )
        );
      }

      return manuscript
        ? right(Result.ok<Manuscript>(manuscript))
        : left(Result.fail(null));

      return right(Result.ok<Manuscript>(manuscript));
    } catch (err) {
      return left(new AppError.UnexpectedError(err));
    }
  }
}
