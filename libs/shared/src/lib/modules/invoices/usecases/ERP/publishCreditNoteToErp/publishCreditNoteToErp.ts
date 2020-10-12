/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @nrwl/nx/enforce-module-boundaries */

// import { getEuMembers } from 'is-eu-member';

import { UseCase } from '../../../../../core/domain/UseCase';
import { right, left } from '../../../../../core/logic/Result';
import { UnexpectedError } from '../../../../../core/logic/AppError';

// * Authorization Logic
import {
  AccessControlledUsecase,
  UsecaseAuthorizationContext,
  AccessControlContext,
} from '../../../../../domain/authorization';

import { LoggerContract } from '../../../../../infrastructure/logging/Logger';
import { ErpServiceContract } from '../../../../../domain/services/ErpService';
// import { ExchangeRateService } from '../../../../domain/services/ExchangeRateService';
// import { VATService } from '../../../../domain/services/VATService';
import { PublishCreditNoteToErpResponse } from './publishCreditNoteToErpResponse';
// import { AddressRepoContract } from '../../../addresses/repos/addressRepo';
import { CouponRepoContract } from '../../../../coupons/repos';
import { WaiverRepoContract } from '../../../../waivers/repos';
import { InvoiceId } from '../../../domain/InvoiceId';
import { UniqueEntityID } from '../../../../../core/domain/UniqueEntityID';
// import { CatalogRepoContract } from '../../../journals/repos';
// import { JournalId } from '../../../journals/domain/JournalId';
import { Invoice } from '../../../domain/Invoice';
// import { PublisherRepoContract } from '../../../publishers/repos';
import { InvoiceRepoContract } from '../../../repos/invoiceRepo';
import { InvoiceItemRepoContract } from '../../../repos/invoiceItemRepo';
// import { PayerRepoContract } from '../../../payers/repos/payerRepo';
// import { PayerType } from '../../../payers/domain/Payer';
// import { ArticleRepoContract } from '../../../manuscripts/repos';
import { GetItemsForInvoiceUsecase } from '../../getItemsForInvoice/getItemsForInvoice';

export interface PublishCreditNoteToErpRequestDTO {
  creditNoteId?: string;
}

export class PublishCreditNoteToErpUsecase
  implements
    UseCase<
      PublishCreditNoteToErpRequestDTO,
      Promise<PublishCreditNoteToErpResponse>,
      UsecaseAuthorizationContext
    >,
    AccessControlledUsecase<
      PublishCreditNoteToErpRequestDTO,
      UsecaseAuthorizationContext,
      AccessControlContext
    > {
  constructor(
    private invoiceRepo: InvoiceRepoContract,
    private invoiceItemRepo: InvoiceItemRepoContract,
    private couponRepo: CouponRepoContract,
    private waiverRepo: WaiverRepoContract,
    // private payerRepo: PayerRepoContract,
    // private addressRepo: AddressRepoContract,
    // private manuscriptRepo: ArticleRepoContract,
    // private catalogRepo: CatalogRepoContract,
    // private sageService: ErpServiceContract,
    private netSuiteService: ErpServiceContract,
    // private publisherRepo: PublisherRepoContract,
    private loggerService: LoggerContract
  ) {}

  private async getAccessControlContext(request: any, context?: any) {
    return {};
  }

  // @Authorize('zzz:zzz')
  public async execute(
    request: PublishCreditNoteToErpRequestDTO,
    context?: UsecaseAuthorizationContext
  ): Promise<PublishCreditNoteToErpResponse> {
    this.loggerService.info('PublishCreditNoteToERP Request', request);

    let creditNote: Invoice;

    try {
      creditNote = await this.invoiceRepo.getInvoiceById(
        InvoiceId.create(new UniqueEntityID(request.creditNoteId)).getValue()
      );
      this.loggerService.info('PublishCreditNoteToERP credit note', creditNote);

      let invoiceItems = creditNote.invoiceItems.currentItems;
      // this.loggerService.info(
      //   'PublishCreditNoteToERP invoiceItems',
      //   invoiceItems
      // );

      if (invoiceItems.length === 0) {
        const getItemsUsecase = new GetItemsForInvoiceUsecase(
          this.invoiceItemRepo,
          this.couponRepo,
          this.waiverRepo
        );

        const resp = await getItemsUsecase.execute({
          invoiceId: request.creditNoteId,
        });
        // this.loggerService.info(
        //   'PublishCreditNoteToERP getItemsUsecase response',
        //   resp
        // );
        if (resp.isLeft()) {
          throw new Error(
            `CreditNote ${creditNote.id.toString()} has no invoice items.`
          );
        }

        invoiceItems = resp.value.getValue();
        // this.loggerService.info(
        //   'PublishCreditNoteToERP invoice items',
        //   invoiceItems
        // );

        for (const item of invoiceItems) {
          const [coupons, waivers] = await Promise.all([
            this.couponRepo.getCouponsByInvoiceItemId(item.invoiceItemId),
            this.waiverRepo.getWaiversByInvoiceItemId(item.invoiceItemId),
          ]);
          coupons.forEach((c) => item.addCoupon(c));
          item.waivers = waivers;
        }
      }

      if (invoiceItems.length === 0) {
        throw new Error(`CreditNote ${creditNote.id} has no invoice items.`);
      }

      creditNote.addItems(invoiceItems);
      // this.loggerService.info(
      //   'PublishCreditNoteToERP full invoice items',
      //   invoiceItems
      // );

      try {
        const erpData = {
          creditNote,
        };

        const netSuiteResponse = await this.netSuiteService.registerCreditNote(
          erpData
        );
        this.loggerService.info(
          `Updating credit note ${creditNote.id.toString()}: netSuiteReference -> ${JSON.stringify(
            netSuiteResponse
          )}`
        );
        creditNote.creditNoteReference = String(netSuiteResponse); // netSuiteResponse;

        // this.loggerService.info('PublishCreditNoteToERP full credit note', creditNote);
        await this.invoiceRepo.update(creditNote);
        return right(netSuiteResponse);
      } catch (err) {
        return left(err);
      }
    } catch (err) {
      console.log(err);
      return left(new UnexpectedError(err, err.toString()));
    }
  }
}
