import {
  Roles,
  Payer,
  Address,
  Invoice,
  PayerMap,
  AddressMap,
  GetAddressUseCase,
  UniqueEntityID,
  InvoiceId,
  InvoiceStatus
} from '@hindawi/shared';

import { Resolvers } from '../schema';
import { Context } from '../../context';

import { CreateAddress } from '../../../../../libs/shared/src/lib/modules/addresses/usecases/createAddress/createAddress';
import { ChangeInvoiceStatus } from '../../../../../libs/shared/src/lib/modules/invoices/usecases/changeInvoiceStatus/changeInvoiceStatus';
import { CreatePayerUsecase } from './../../../../../libs/shared/src/lib/modules/payers/usecases/createPayer/createPayer';
import { DomainEvents } from 'libs/shared/src/lib/core/domain/events/DomainEvents';

export const payer: Resolvers<Context> = {
  Mutation: {
    async confirmInvoice(parent, args, context) {
      let address: Address;
      let updatedPayer: Payer;
      let invoice: Invoice;

      const { repos, vatService } = context;
      const usecaseContext = { roles: [Roles.PAYER] };
      const { payer } = args;
      const invoiceId = InvoiceId.create(
        new UniqueEntityID(payer.invoiceId)
      ).getValue();
      invoice = await repos.invoice.getInvoiceById(invoiceId);

      const createAddressUseCase = new CreateAddress(repos.address);
      const createPayerUseCase = new CreatePayerUsecase(repos.payer);
      const changeInvoiceStatusUseCase = new ChangeInvoiceStatus(repos.invoice);

      if (payer.type === 'INSTITUTION') {
        const vatResult = await vatService.checkVAT({
          countryCode: payer.address.country,
          vatNumber: payer.vatId
        });

        if (!vatResult.valid) {
          console.log(`VAT ${payer.vatId} is not valid.`);
        }
      }

      const addressResult = await createAddressUseCase.execute({
        city: payer.address.city,
        country: payer.address.country,
        addressLine1: payer.address.addressLine1
      });

      if (addressResult.isRight()) {
        address = addressResult.value.getValue();
      }

      const createPayerRequest = {
        invoiceId: payer.invoiceId,
        type: payer.type,
        name: payer.name,
        email: payer.email,
        vatId: payer.vatId,
        organization: payer.organization || ' ',
        addressId: address.addressId.id.toString()
      };

      const payerResult = await createPayerUseCase.execute(
        createPayerRequest,
        usecaseContext
      );

      if (payerResult.isRight()) {
        updatedPayer = payerResult.value.getValue();
      }

      if (invoice.status != InvoiceStatus.ACTIVE) {
        invoice.markAsActive();
        await changeInvoiceStatusUseCase.execute({
          invoiceId: updatedPayer.invoiceId.id.toString(),
          status: 'ACTIVE'
        });
      }

      DomainEvents.dispatchEventsForAggregate(invoice.id);

      return PayerMap.toPersistence(updatedPayer);
    }
  },
  Payer: {
    async address(payer: any, args: any, context) {
      const getAddressUseCase = new GetAddressUseCase(context.repos.address);

      const address = await getAddressUseCase.execute({
        billingAddressId: payer.billingAddressId
      });

      if (address.isLeft()) {
        throw new Error(`Can't get address for payer ${payer.id}`);
      }

      return AddressMap.toPersistence(address.value.getValue());
    }
  }
};
