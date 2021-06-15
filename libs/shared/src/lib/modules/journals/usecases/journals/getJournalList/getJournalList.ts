// * Core Domain
import { UnexpectedError } from '../../../../../core/logic/AppError';
import { left, right } from '../../../../../core/logic/Either';
import { UseCase } from '../../../../../core/domain/UseCase';

// * Authorization Logic
import type { UsecaseAuthorizationContext as Context } from '../../../../../domain/authorization';
import {
  AccessControlledUsecase,
  AccessControlContext,
  Authorize,
} from '../../../../../domain/authorization';

import { CatalogRepoContract } from '../../../repos/catalogRepo';

// * Usecase specifics
import { GetJournalListResponse as Response } from './getJournalListResponse';
import type { GetJournalListDTO as DTO } from './getJournalListDTO';

export class GetJournalListUsecase
  implements
    UseCase<DTO, Promise<Response>, Context>,
    AccessControlledUsecase<DTO, Context, AccessControlContext> {
  constructor(private journalRepo: CatalogRepoContract) {}

  private async getAccessControlContext(request, context?) {
    return {};
  }

  @Authorize('journal:read')
  public async execute(request: DTO, context?: Context): Promise<Response> {
    try {
      const result = await this.journalRepo.getCatalogCollection();

      if (result.isLeft()) {
        return left(new UnexpectedError(new Error(result.value.message)));
      }

      return right(result.value);
    } catch (err) {
      return left(new UnexpectedError(err, 'Getting journal list failed'));
    }
  }
}
