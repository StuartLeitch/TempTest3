/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @nrwl/nx/enforce-module-boundaries */

import { Either, right, left } from '../../../../../core/logic/Result';
import { UnexpectedError } from '../../../../../core/logic/AppError';
import { UseCase } from '../../../../../core/domain/UseCase';

// * Authorization Logic
import {
  UsecaseAuthorizationContext,
  AccessControlledUsecase,
  AccessControlContext,
} from '../../../../../domain/authorization';

import { ArticleRepoContract } from '../../../../manuscripts/repos/articleRepo';
import { AddressRepoContract } from '../../../../addresses/repos/addressRepo';
import { InvoiceItemRepoContract } from '../../../repos/invoiceItemRepo';
import { PayerRepoContract } from '../../../../payers/repos/payerRepo';
import { PublisherRepoContract } from '../../../../publishers/repos';
import { CatalogRepoContract } from '../../../../journals/repos';
import { InvoiceRepoContract } from '../../../repos/invoiceRepo';
import { CouponRepoContract } from '../../../../coupons/repos';
import { WaiverRepoContract } from '../../../../waivers/repos';

import { ErpServiceContract } from '../../../../../domain/services/ErpService';
import { LoggerContract } from '../../../../../infrastructure/logging/Logger';
import { VATService } from 'libs/shared/src/lib/domain/services/VATService';

import { PublishInvoiceToErpUsecase } from '../publishInvoiceToErp/publishInvoiceToErp';

import { ErpInvoiceResponse } from '../../../../../domain/services/ErpService';

export type RetryFailedSageErpInvoicesResponse = Either<
  UnexpectedError | ErpInvoiceResponse,
  ErpInvoiceResponse[]
>;

export class RetryFailedSageErpInvoicesUsecase
  implements
    UseCase<
      Record<string, unknown>,
      Promise<RetryFailedSageErpInvoicesResponse>,
      UsecaseAuthorizationContext
    >,
    AccessControlledUsecase<
      Record<string, unknown>,
      UsecaseAuthorizationContext,
      AccessControlContext
    > {
  private publishToErpUsecase: PublishInvoiceToErpUsecase;
  constructor(
    private invoiceRepo: InvoiceRepoContract,
    private invoiceItemRepo: InvoiceItemRepoContract,
    private couponRepo: CouponRepoContract,
    private waiverRepo: WaiverRepoContract,
    private payerRepo: PayerRepoContract,
    private addressRepo: AddressRepoContract,
    private manuscriptRepo: ArticleRepoContract,
    private catalogRepo: CatalogRepoContract,
    private sageService: ErpServiceContract,
    private publisherRepo: PublisherRepoContract,
    private loggerService: LoggerContract,
    private vatService: VATService
  ) {
    this.publishToErpUsecase = new PublishInvoiceToErpUsecase(
      this.invoiceRepo,
      this.invoiceItemRepo,
      this.couponRepo,
      this.waiverRepo,
      this.payerRepo,
      this.addressRepo,
      this.manuscriptRepo,
      this.catalogRepo,
      this.sageService,
      this.publisherRepo,
      this.loggerService,
      this.vatService
    );
  }

  private async getAccessControlContext(request, context?) {
    return {};
  }

  // @Authorize('zzz:zzz')
  public async execute(
    request?: Record<string, unknown>,
    context?: UsecaseAuthorizationContext
  ): Promise<RetryFailedSageErpInvoicesResponse> {
    try {
      const failedErpInvoices = await this.invoiceRepo.getFailedSageErpInvoices();

      const updatedInvoices: ErpInvoiceResponse[] = [];

      if (failedErpInvoices.length === 0) {
        this.loggerService.info('No failed erp invoices');
        return right(updatedInvoices);
      }
      this.loggerService.info(
        `Retrying sync with erp for invoices: ${failedErpInvoices
          .map((i) => i.invoiceId.id.toString())
          .join(', ')}`
      );
      const errs = [];

      for (const failedInvoice of failedErpInvoices) {
        const maybeUpdatedInvoiceResponse = await this.publishToErpUsecase.execute(
          {
            invoiceId: failedInvoice.invoiceId.id.toString(),
          }
        );

        const updatedInvoiceResponse = maybeUpdatedInvoiceResponse.value;

        if (
          typeof maybeUpdatedInvoiceResponse.isLeft === 'function' &&
          maybeUpdatedInvoiceResponse.isLeft()
        ) {
          return left(updatedInvoiceResponse);
        }
        const assignedErpReference = updatedInvoiceResponse as ErpInvoiceResponse;

        // console.log('Assigned ERP Reference:');
        // console.info('type ', typeof assignedErpReference);
        // console.info(assignedErpReference);

        if (assignedErpReference) {
          console.log(
            `Assigned successfully ${
              assignedErpReference?.tradeDocumentId
            } to invoice ${failedInvoice.invoiceId.id.toString()}`
          );
          updatedInvoices.push(assignedErpReference);
        }
      }

      if (errs.length > 0) {
        console.log(JSON.stringify(errs, null, 2));
        return left(new UnexpectedError(errs, JSON.stringify(errs)));
      }

      return right(updatedInvoices);
    } catch (err) {
      console.log(err);
      return left(new UnexpectedError(err, err.toString()));
    }
  }
}