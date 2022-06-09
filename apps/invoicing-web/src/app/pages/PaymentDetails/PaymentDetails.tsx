import { Loader, Flex, Text, th } from "@hindawi/react-components";
import React, { useCallback, useEffect, useState } from "react";
import { RootState } from "typesafe-actions";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { connect } from "react-redux";
import { ASTNode } from "graphql";
import gql from "graphql-tag";

import { Details } from "./Details";
import { BillingInfo } from "./BillingInfo";
import { InvoicePayment } from "./InvoicePayment";
import { PaymentHeader } from "./PaymentHeader";
import { PaymentFooter } from "./PaymentFooter";

import { oneContext } from "../../../context";

import { invoiceActions, invoiceSelectors } from "../../state/modules/invoice";

import {
  paymentSelectors,
  paymentActions,
  paymentTypes,
} from "../../state/modules/payment";
import {
  InvoiceVATDTO,
  ApplyCouponDTO,
} from "../../state/modules/invoice/types";

interface Props {
  invoiceError: string;
  invoiceLoading: boolean;
  invoice: any;
  payerError: string;
  payerLoading: boolean;
  creditCardPaymentError: string;
  creditCardPaymentLoading: boolean;
  payPalPaymentError: string;
  payPalPaymentLoading: boolean;
  getMethodsError: string;
  getMethodsLoading: boolean;
  couponError: string;
  paymentMethods: Record<string, string>;
  token: string;
  getInvoice(id: string): any;
  getInvoiceVAT(invoiceVATRequest: InvoiceVATDTO): any;
  applyCoupon(applyCouponDTO: ApplyCouponDTO): any;
  updatePayer(payer: any): any;
  recordPayPalPayment(payment: paymentTypes.PayPalPayment): any;
  payWithCard(payload: any): any;
  getPaymentMethods(): any;
  getClientToken(): any;
}

const payByPayPal = (recordAction, invoice) => {
  return (data) => {
    return recordAction({
      invoiceId: invoice.invoiceId,
      orderId: data.orderId,
    });
  };
};

const createPayPalOrder: ASTNode = gql`
  mutation createPayPalOrder($invoiceId: ID!) {
    createPayPalOrder(invoiceId: $invoiceId) {
      id
    }
  }
`;

const createPayPalOrderAction = (invoice, setError) => {
  return async () => {
    try {
      const aa: any = await oneContext.graphqlAdapter.send(createPayPalOrder, {
        invoiceId: invoice.invoiceId,
      });
      return aa.data.createPayPalOrder.id;
    } catch (err) {
      setError(err.message);
    }
  };
};

const InvoiceDetailsError = () => (
  <Flex mt={20}>
    <Text>Invoice details are not available.</Text>
  </Flex>
);

const PaymentDetails: React.FunctionComponent<Props> = ({
  getInvoiceVAT,
  getInvoice,
  applyCoupon,
  couponError,
  getClientToken,
  invoice,
  invoiceError,
  invoiceLoading,
  //
  updatePayer,
  payerError,
  payerLoading,
  //
  recordPayPalPayment,
  getPaymentMethods,
  payWithCard,
  creditCardPaymentError,
  creditCardPaymentLoading,
  payPalPaymentError,
  payPalPaymentLoading,
  paymentMethods,
  token,
}) => {
  const { invoiceId } = useParams() as any;
  const [paypalInvoiceCreationError, setPaypalInvoiceCreationError] =
    useState(null);

  // * This will only run once
  useEffect(() => {
    getInvoice(invoiceId);
    getPaymentMethods();
    getClientToken();
  }, [invoiceId, getInvoice, getPaymentMethods, getClientToken]);

  const payByCard = useCallback(
    (values) => payWithCard({ invoiceId, ...values }),
    [invoiceId, payWithCard],
  );

  const paymentContent = () => {
    const invoiceTransactionIsNotDraft = invoice.transaction.status !== "DRAFT";

    if (invoiceTransactionIsNotDraft) {
      return (
        <>
          <PaymentHeader articleTitle={invoice.article.title} />
          <Root>
            <FormsContainer>
              <BillingInfo
                status={invoice.status}
                payer={invoice.payer}
                error={payerError}
                handleSubmit={updatePayer}
                loading={payerLoading}
                applyCoupon={(invoiceId, couponCode) => {
                  applyCoupon({ invoiceId, couponCode });
                }}
                refreshInvoice={() => getInvoice(invoice.invoiceId)}
                couponError={couponError}
                onVatFieldChange={(country, state, postalCode, payerType) =>
                  getInvoiceVAT({
                    postalCode,
                    invoiceId,
                    payerType,
                    country,
                    state,
                  })
                }
              />
              <InvoicePayment
                ccToken={token}
                methods={paymentMethods}
                invoiceStatus={invoice.status}
                createPayPalOrder={createPayPalOrderAction(
                  invoice,
                  setPaypalInvoiceCreationError,
                )}
                paymentStatus={invoice.payments.map((p) => p.status)}
                error={
                  creditCardPaymentError ||
                  payPalPaymentError ||
                  paypalInvoiceCreationError
                }
                payByCardSubmit={payByCard}
                payByPayPalSubmit={payByPayPal(recordPayPalPayment, invoice)}
                loading={creditCardPaymentLoading || payPalPaymentLoading}
              />
            </FormsContainer>

            <Details invoice={invoice} mt={-44} />
          </Root>
        </>
      );
    }

    return <InvoiceDetailsError />;
  };

  return (function () {
    if (invoiceError) {
      return <InvoiceDetailsError />;
    }

    if (invoiceLoading) {
      return (
        <Flex alignItems="center" vertical flex={2} mt={20}>
          <Text mb={2}>Fetching invoice&hellip;</Text>
          <Loader size={6} />
        </Flex>
      );
    }

    return (
      <Flex vertical height="calc(100% - 62px)" justifyContent="space-between">
        <Flex vertical>{paymentContent()}</Flex>
        <PaymentFooter />
      </Flex>
    );
  })();
};

const mapStateToProps = (state: RootState) => ({
  invoice: invoiceSelectors.invoice(state),
  invoiceError: invoiceSelectors.invoiceError(state),
  couponError: invoiceSelectors.couponError(state),
  invoiceLoading: invoiceSelectors.invoiceLoading(state),
  payerError: invoiceSelectors.payerError(state),
  payerLoading: invoiceSelectors.payerLoading(state),
  getMethodsError: paymentSelectors.paymentMethodsError(state),
  getMethodsLoading: paymentSelectors.paymentMethodsLoading(state),
  paymentMethods: paymentSelectors.getPaymentMethods(state),
  token: paymentSelectors.getToken(state),
  creditCardPaymentError: paymentSelectors.recordCreditCardPaymentError(state),
  creditCardPaymentLoading:
    paymentSelectors.recordCreditCardPaymentLoading(state),
  payPalPaymentError: paymentSelectors.recordPayPalPaymentError(state),
  payPalPaymentLoading: paymentSelectors.recordPayPalPaymentLoading(state),
});

export default connect(mapStateToProps, {
  getInvoiceVAT: invoiceActions.getInvoiceVat.request,
  recordPayPalPayment: paymentActions.recordPayPalPayment.request,
  getPaymentMethods: paymentActions.getPaymentMethods.request,
  getClientToken: paymentActions.getClientToken.request,
  payWithCard: paymentActions.recordCardPayment.request,
  updatePayer: invoiceActions.updatePayerAsync.request,
  getInvoice: invoiceActions.getInvoice.request,
  applyCoupon: invoiceActions.applyCouponAction.request,
})(PaymentDetails);

const Root = styled.div`
  width: 100%;
  align-items: flex-start;
  display: flex;
  padding: calc(${th("gridUnit")} * 6) calc(${th("gridUnit")} * 8);
`;

const FormsContainer = styled.div`
  display: flex;
  flex: 2;
  flex-direction: column;
  margin-right: calc(${th("gridUnit")} * 4);
`;
