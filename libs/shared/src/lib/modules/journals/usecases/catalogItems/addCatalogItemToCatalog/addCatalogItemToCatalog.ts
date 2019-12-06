import { UseCase } from '../../../../../core/domain/UseCase';
import { Result, Either, left, right } from '../../../../../core/logic/Result';

import { CatalogItem } from '../../../domain/CatalogItem';
import { CatalogRepoContract } from '../../../repos/catalogRepo';
import { JournalId } from '../../../domain/JournalId';
import { UniqueEntityID } from 'libs/shared/src/lib/core/domain/UniqueEntityID';
import { AppError } from 'libs/shared/src/lib/core/logic/AppError';
import { CatalogMap } from '../../../mappers/CatalogMap';

export interface AddCatalogItemToCatalogUseCaseRequestDTO {
  type: string;
  amount: number;
  currency?: string;
  journalId: string;
  journalTitle?: string;
  issn?: string;
  created?: string;
  updated?: string;
  isActive?: boolean;
}
export type AddCatalogItemToCatalogUseCaseResponse = Either<
  // | UpdateTransactionErrors.SomeBlahBlahError
  AppError.UnexpectedError,
  Result<CatalogItem>
>;
export class AddCatalogItemToCatalogUseCase
  implements
    UseCase<
      AddCatalogItemToCatalogUseCaseRequestDTO,
      AddCatalogItemToCatalogUseCaseResponse
    > {
  private catalogRepo: CatalogRepoContract;

  constructor(catalogRepo: CatalogRepoContract) {
    this.catalogRepo = catalogRepo;
  }

  public async execute(
    request: AddCatalogItemToCatalogUseCaseRequestDTO
  ): Promise<AddCatalogItemToCatalogUseCaseResponse> {
    const {
      type,
      amount,
      created,
      currency,
      isActive,
      issn,
      journalId,
      journalTitle,
      updated
    } = request;

    try {
      const catalogItemOrError = CatalogItem.create({
        type,
        amount,
        created: created ? new Date(created) : null,
        updated: updated ? new Date(updated) : null,
        currency,
        isActive,
        issn,
        journalId: JournalId.create(new UniqueEntityID(journalId)).getValue(),
        journalTitle
      }, new UniqueEntityID());

      if (catalogItemOrError.isFailure) {
        return left(new AppError.UnexpectedError(catalogItemOrError.error))
      }

      const catalogItem = catalogItemOrError.getValue();

      // This is where all the magic happens
      await this.catalogRepo.save(catalogItem);

      return right(Result.ok<CatalogItem>(catalogItem));
    } catch (err) {
      console.log(err);
      return left(new AppError.UnexpectedError(err));
    }
  }
}
