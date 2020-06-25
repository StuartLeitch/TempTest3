import { UniqueEntityID } from '../../../../../core/domain/UniqueEntityID';
import { UseCase } from '../../../../../core/domain/UseCase';
import { AppError } from '../../../../../core/logic/AppError';
import { Result, Either, left, right } from '../../../../../core/logic/Result';

import { CatalogItem } from '../../../domain/CatalogItem';
import { CatalogRepoContract } from '../../../repos/catalogRepo';
import { JournalId } from '../../../domain/JournalId';
import { CatalogMap } from '../../../mappers/CatalogMap';

export interface UpdateCatalogItemToCatalogUseCaseRequestDTO {
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
export type UpdateCatalogItemToCatalogUseCaseResponse = Either<
  // | UpdateTransactionErrors.SomeBlahBlahError
  AppError.UnexpectedError,
  Result<CatalogItem>
>;
export class UpdateCatalogItemToCatalogUseCase
  implements
    UseCase<
      UpdateCatalogItemToCatalogUseCaseRequestDTO,
      UpdateCatalogItemToCatalogUseCaseResponse
    > {
  private catalogRepo: CatalogRepoContract;

  constructor(catalogRepo: CatalogRepoContract) {
    this.catalogRepo = catalogRepo;
  }

  public async execute(
    request: UpdateCatalogItemToCatalogUseCaseRequestDTO
  ): Promise<UpdateCatalogItemToCatalogUseCaseResponse> {
    const {
      type,
      amount,
      created,
      currency,
      isActive,
      issn,
      journalId: rawJournalId,
      journalTitle,
      updated,
    } = request;

    try {
      const journalId: JournalId = JournalId.create(
        new UniqueEntityID(rawJournalId)
      ).getValue();

      // getting catalog item id
      const catalogItem = await this.catalogRepo.getCatalogItemByJournalId(
        journalId
      );

      if (!catalogItem) {
        return left(
          new AppError.UnexpectedError(
            `Journal with id ${journalId.id.toString()} does not exist.`
          )
        );
      }

      const updatedCatalogItem = CatalogMap.toDomain({
        id: journalId.id.toString(),
        type,
        apc: amount,
        created: created ? new Date(created) : null,
        updated: updated ? new Date(updated) : null,
        currency,
        isActive,
        issn,
        journalId,
        journalTitle,
      });

      // console.log('updatedCatalogItem');
      // console.info(updatedCatalogItem);

      // * This is where all the magic happens
      await this.catalogRepo.updateCatalogItem(updatedCatalogItem);

      // TODO: will editors change here?
      return right(Result.ok<CatalogItem>(updatedCatalogItem));
    } catch (err) {
      console.log(err);
      return left(new AppError.UnexpectedError(err));
    }
  }
}
