import * as checkoutNodeJsSDK from '@paypal/checkout-server-sdk';

import {
  PayPalServiceContract as ServiceContract,
  PayPalOrderResponse as OrderResponse,
  PayPalOrderRequest as OrderRequest,
  PayPalOrderStatus as OrderStatus,
  PayPalServiceErrors as Errors,
  ExternalOrderId,
  LoggerContract,
  Either,
  right,
  left,
} from '@hindawi/shared';

import {
  PayPalOrderResponse,
  OrdersCreateRequest,
  PayPalOrderRequest,
  PayPalEnvironment,
  OrdersGetRequest,
  PayPalHttpClient,
  ResponsePrefer,
  ItemCategory,
  PayPalIntent,
  UserAction,
  Response,
} from './types';

export interface PayPalServiceData {
  clientSecret: string;
  environment: string;
  clientId: string;
}

export class PayPalService implements ServiceContract {
  private httpClient: PayPalHttpClient;

  constructor(connData: PayPalServiceData, private logger: LoggerContract) {
    this.httpClient = new checkoutNodeJsSDK.core.PayPalHttpClient(
      this.createEnvironment(connData)
    );
  }

  private createEnvironment({
    clientId,
    clientSecret,
    environment,
  }: PayPalServiceData): PayPalEnvironment {
    if (environment === 'live' || environment === 'production') {
      return new checkoutNodeJsSDK.core.LiveEnvironment(clientId, clientSecret);
    } else {
      return new checkoutNodeJsSDK.core.SandboxEnvironment(
        clientId,
        clientSecret
      );
    }
  }

  async createOrder(
    request: OrderRequest
  ): Promise<
    Either<
      Errors.UnsuccessfulOrderCreation | Errors.UnexpectedError,
      ExternalOrderId
    >
  > {
    const newOrder: PayPalOrderRequest = {
      intent: PayPalIntent.AUTHORIZE,
      purchase_units: [
        {
          description: `${request.manuscriptCustomId} Article Processing charges`,
          invoice_id: request.invoiceReferenceNumber,
          custom_id: request.invoiceId,
          amount: {
            value: request.paymentTotal.toString(),
            currency_code: 'USD',
            breakdown: {
              item_total: {
                value: request.netAmount.toString(),
                currency_code: 'USD',
              },
              tax_total: request.vatAmount
                ? {
                    value: request.vatAmount.toString(),
                    currency_code: 'USD',
                  }
                : undefined,
              discount: request.discountAmount
                ? {
                    value: request.discountAmount.toString(),
                    currency_code: 'USD',
                  }
                : undefined,
            },
          },
          items: [
            {
              name: `Article Processing charges for manuscript ${request.manuscriptCustomId}`,
              quantity: '1',
              unit_amount: {
                value: request.netAmount.toString(),
                currency_code: 'USD',
              },
              category: ItemCategory.DIGITAL_GOODS,
              tax: {
                value: request.vatAmount.toString(),
                currency_code: 'USD',
              },
            },
          ],
        },
      ],
      application_context: {
        user_action: UserAction.PAY_NOW,
      },
    };

    let response: Response<PayPalOrderResponse>;

    try {
      response = await this.httpClient.execute<PayPalOrderResponse>(
        this.createOrderRequest(newOrder)
      );
    } catch (e) {
      console.log('---------------------------------------------');
      console.info(e);
      this.logger.error(`Error on paypal create order`, e);
      return left(new Errors.UnexpectedError(e));
    }

    if (response.statusCode >= 300) {
      console.log('---------------------------------------------');
      console.info(response);
      this.logger.error(
        `Error on paypal create order with message: ${response.result.toString()}`
      );
      return left(
        new Errors.UnsuccessfulOrderCreation(response.result.toString())
      );
    }

    return right(ExternalOrderId.create(response.result.id));
  }

  async getOrder(
    orderId: string
  ): Promise<
    Either<
      Errors.UnsuccessfulOrderRetrieval | Errors.UnexpectedError,
      OrderResponse
    >
  > {
    let response: Response<PayPalOrderResponse>;

    try {
      response = await this.httpClient.execute<PayPalOrderResponse>(
        this.getOrderRequest(orderId)
      );
    } catch (e) {
      this.logger.error(`Error on paypal get order`, e);
      return left(new Errors.UnexpectedError(e));
    }

    if (response.statusCode >= 300) {
      this.logger.error(
        `Error on paypal get order with message: ${response.result.toString()}`
      );
      return left(
        new Errors.UnsuccessfulOrderRetrieval(response.result.toString())
      );
    }

    const order = response.result;
    const orderDetails: OrderResponse = {
      totalPayed: Number.parseFloat(order.purchase_units[0].amount.value),
      invoiceReferenceNumber: order.purchase_units[0].custom_id,
      status: (order.status as unknown) as OrderStatus,
    };

    return right(orderDetails);
  }

  private createOrderRequest(payload: PayPalOrderRequest): OrdersCreateRequest {
    const newRequest: OrdersCreateRequest = new checkoutNodeJsSDK.orders.OrdersCreateRequest();

    newRequest.prefer(ResponsePrefer.REPRESENTATION);
    newRequest.requestBody(payload);

    return newRequest;
  }

  private getOrderRequest(orderId: string): OrdersGetRequest {
    const newRequest: OrdersGetRequest = new checkoutNodeJsSDK.orders.OrdersGetRequest(
      orderId
    );

    return newRequest;
  }
}
