import { UniqueEntityID } from '../../../../../core/domain/UniqueEntityID';
import { Result, right, left } from '../../../../../core/logic/Result';
import { UnexpectedError } from '../../../../../core/logic/AppError';
import { UseCase } from '../../../../../core/domain/UseCase';

// * Authorization Logic
import {
  UsecaseAuthorizationContext,
  AccessControlledUsecase,
  AccessControlContext,
} from '../../../../../domain/authorization';

import { ErpServiceContract } from '../../../../../domain/services/ErpService';
import { AddressRepoContract } from '../../../../addresses/repos/addressRepo';
import { InvoiceItemRepoContract } from './../../../repos/invoiceItemRepo';
import { PayerRepoContract } from '../../../../payers/repos/payerRepo';
import { PublisherRepoContract } from '../../../../publishers/repos';
import { ArticleRepoContract } from '../../../../manuscripts/repos';
import { InvoiceRepoContract } from './../../../repos/invoiceRepo';
import { CatalogRepoContract } from '../../../../journals/repos';
import { CouponRepoContract } from '../../../../coupons/repos';
import { WaiverRepoContract } from '../../../../waivers/repos';

import { JournalId } from '../../../../journals/domain/JournalId';
import { Payer } from '../../../../payers/domain/Payer';

import { LoggerContract } from '../../../../../infrastructure/logging/Logger';

import { GetItemsForInvoiceUsecase } from './../../getItemsForInvoice/getItemsForInvoice';
import { GetInvoiceDetailsUsecase } from './../../getInvoiceDetails';
import { GetPayerDetailsByInvoiceIdUsecase } from './../../../../payers/usecases/getPayerDetailsByInvoiceId';
import { GetAddressUseCase } from './,,/../../../../../addresses/usecases/getAddress/getAddress';
import { GetManuscriptByManuscriptIdUsecase } from './../../../../manuscripts/usecases/getManuscriptByManuscriptId';
import { PublishRevenueRecognitionReversalDTO as DTO } from './publishRevenueRecognitionReversal.dto';
import { PublishRevenueRecognitionReversalResponse as Response } from './publishRevenueRecognitionReversal.response';
import * as Errors from './publishRevenueRecognitionReversal.errors';

export class PublishRevenuRecognitionReversalUsecase
  implements
    UseCase<DTO, Promise<Response>, UsecaseAuthorizationContext>,
    AccessControlledUsecase<
      DTO,
      UsecaseAuthorizationContext,
      AccessControlContext
    > {
  constructor(
    private invoiceRepo: InvoiceRepoContract,
    private invoiceItemRepo: InvoiceItemRepoContract,
    private couponRepo: CouponRepoContract,
    private waiverRepo: WaiverRepoContract,
    private payerRepo: PayerRepoContract,
    private addressRepo: AddressRepoContract,
    private manuscriptRepo: ArticleRepoContract,
    private catalogRepo: CatalogRepoContract,
    private publisherRepo: PublisherRepoContract,
    private erpService: ErpServiceContract,
    private loggerService: LoggerContract
  ) {}

  private async getAccessControlContext(request: any, context?: any) {
    return {};
  }

  public async execute(
    request: DTO,
    context?: UsecaseAuthorizationContext
  ): Promise<Response> {
    let payer: Payer;

    const invoiceId = request.invoiceId;
    const getItemsUsecase = new GetItemsForInvoiceUsecase(
      this.invoiceItemRepo,
      this.couponRepo,
      this.waiverRepo
    );

    const getInvoiceDetails = new GetInvoiceDetailsUsecase(this.invoiceRepo);
    const getPayerDetails = new GetPayerDetailsByInvoiceIdUsecase(
      this.payerRepo,
      this.loggerService
    );
    const getAddress = new GetAddressUseCase(this.addressRepo);
    const getManuscript = new GetManuscriptByManuscriptIdUsecase(
      this.manuscriptRepo
    );

    try {
      // Get Invoice
      const maybeInvoice = await getInvoiceDetails.execute({
        invoiceId,
      });

      if (maybeInvoice.isLeft()) {
        throw new Errors.InvoiceNotFoundError(invoiceId);
      }
      const invoice = maybeInvoice.value.getValue();

      //Get Invoice Items
      const maybeItems = await getItemsUsecase.execute({
        invoiceId,
      });

      if (maybeItems.isLeft()) {
        throw new Errors.InvoiceItemsNotFoundError(invoiceId);
      }

      const invoiceItems = maybeItems.value.getValue();
      if (invoiceItems.length === 0) {
        throw new Errors.InvoiceItemsNotFoundError(invoiceId);
      }

      invoice.addItems(invoiceItems);

      if (!invoice.isCreditNote()) {
        //Get Payer details
        const maybePayer = await getPayerDetails.execute({ invoiceId });
        if (maybePayer.isLeft()) {
          throw new Errors.InvoicePayersNotFoundError(invoiceId);
        }
        const payer = maybePayer.value.getValue();
        const addressId = payer.billingAddressId.id.toString();

        //Get Billing address
        const maybeAddress = await getAddress.execute({
          billingAddressId: addressId,
        });
        if (maybeAddress.isLeft()) {
          throw new Errors.InvoiceAddressNotFoundError(invoiceId);
        }
      }

      // Get Manuscript
      const manuscriptId = invoiceItems[0].manuscriptId.id.toString();
      const maybeManuscript = await getManuscript.execute({ manuscriptId });
      if (maybeManuscript.isLeft()) {
        throw new Errors.InvoiceManuscriptNotFoundError(invoiceId);
      }

      const manuscript = maybeManuscript.value.getValue();
      if (!manuscript.datePublished) {
        return right(Result.ok<any>(null));
      }

      // * If it's a credit node and the manuscript has been published
      if (invoice.isCreditNote() && manuscript.datePublished) {
        return right(Result.ok<any>(null));
      }

      // console.info(invoice);
      // console.info(manuscript);
      // console.info(referencedInvoicesByCustomId);

      const { customId } = manuscript;

      // * Get all invoices associated with this custom id
      const referencedInvoicesByCustomId: any[] = await this.invoiceRepo.getInvoicesByCustomId(
        customId
      );

      // * If the invoice has a credit note
      // * and the manuscript has been published before its creation
      const associatedCreditNote = referencedInvoicesByCustomId.find(
        (item) =>
          item.cancelledInvoiceReference === invoice.invoiceId.id.toString()
      );

      if (associatedCreditNote) {
        const creditNoteCreatedOn = new Date(
          associatedCreditNote.invoiceDateCreated
        );
        const { datePublished: manuscriptPublishedOn } = manuscript;

        if (
          !invoice.isCreditNote() &&
          creditNoteCreatedOn.getTime() > manuscriptPublishedOn.getTime()
        ) {
          return right(Result.ok<any>(null));
        }
      }

      const catalog = await this.catalogRepo.getCatalogItemByJournalId(
        JournalId.create(new UniqueEntityID(manuscript.journalId)).getValue()
      );

      if (!catalog) {
        throw new Error(`Invoice ${invoice.id} has no catalog associated.`);
      }

      const publisherCustomValues = await this.publisherRepo.getCustomValuesByPublisherId(
        catalog.publisherId
      );
      if (!publisherCustomValues) {
        throw new Error(`Invoice ${invoice.id} has no publisher associated.`);
      }

      const invoiceItem = invoice.invoiceItems.getItems().shift();
      const { coupons, waivers, price } = invoiceItem;
      let netCharges = price;
      if (coupons?.length) {
        netCharges -= coupons.reduce(
          (acc, coupon) => acc + (coupon.reduction / 100) * price,
          0
        );
      }
      if (waivers?.length) {
        netCharges -= waivers.reduce(
          (acc, waiver) => acc + (waiver.reduction / 100) * price,
          0
        );
      }

      // * Check if invoice amount is zero or less - in this case, we don't need to send to ERP
      if (netCharges <= 0) {
        invoice.erpReference = 'NON_INVOICEABLE';
        invoice.nsReference = 'NON_INVOICEABLE';
        await this.invoiceRepo.update(invoice);
        return right(Result.ok<any>(null));
      }

      const erpResponse = await this.erpService.registerRevenueRecognitionReversal(
        {
          manuscript,
          invoice,
          payer,
          publisherCustomValues,
          invoiceTotal: netCharges,
        }
      );

      this.loggerService.info(
        'ERP field',
        this.erpService.invoiceRevenueRecRefFieldName
      );
      this.loggerService.info('ERP response', erpResponse);

      this.loggerService.info(
        `ERP Revenue Recognized Invoice ${invoice.id.toString()}: revenueRecognitionReference -> ${JSON.stringify(
          erpResponse
        )}`
      );

      if (erpResponse?.journal?.id) {
        invoice[this.erpService.invoiceRevenueRecRefFieldName] = String(
          erpResponse?.journal?.id
        );
      }

      await this.invoiceRepo.update(invoice);

      return right(Result.ok<any>(erpResponse));
    } catch (err) {
      console.log(err);
      return left(new UnexpectedError(err, err.toString()));
    }
  }
}
