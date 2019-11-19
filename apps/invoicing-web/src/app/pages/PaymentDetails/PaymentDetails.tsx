import React, { Fragment, useEffect, useCallback } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { RootState } from "typesafe-actions";
import { useParams } from "react-router-dom";
import { Flex, Loader, Text, th } from "@hindawi/react-components";

import { Details } from "./Details";
import { BillingInfo } from "./BillingInfo";
import { InvoicePayment } from "./InvoicePayment";
import { PaymentHeader } from "./PaymentHeader";

import {
  invoiceTypes,
  invoiceActions,
  invoiceSelectors,
} from "../../state/modules/invoice";

import {
  paymentsActions,
  paymentsSelectors,
} from "../../state/modules/payments";
import { PaymentMethod } from "../../state/modules/payments/types";

interface Props {
  invoiceError: string;
  invoiceLoading: boolean;
  invoice: invoiceTypes.Invoice | null;
  payerError: string;
  payerLoading: boolean;
  paymentError: string;
  paymentLoading: boolean;
  getMethodsError: string;
  getMethodsLoading: boolean;
  paymentMethods: Record<string, string>;
  getInvoice(id: string): any;
  updatePayer(payer: any): any;
  payWithCard(payload: any): any;
  getPaymentMethods(): any;
}

const articleDetails = {
  journalTitle: "Parkinson's Disease",
  title:
    "A Key Major Guideline for Engineering Bioactive Multicomponent Nanofunctionalization for Biomedicine and Other Applications: Fundamental Models Confirmed by Both Direct and Indirect Evidence",
  id: 2016970,
  type: "Research Article",
  ccLicense: "CC-BY 4.0",
  correspondingAuthor: "Patrick M. Sullivan",
  authors: [
    "Patrick M. Sullivan",
    "Patrick M. Sullivan1",
    "Patrick M. Sullivan2",
    "Patrick M. Sullivan3",
  ],
};

const invoiceDetails = {
  terms: "Payable upon Receipt",
  referenceNumber: "617/2019",
  supplyDate: "xxxxxxxx",
  issueDate: "xxxxxxxx",
};

const charges = {
  items: [{ name: "Article Processing Charges", price: "$1,250.00" }],
  netTotal: "$1,250.00",
  vat: {
    percent: "20",
    value: "$250.00",
    details: "VAT amount in GBP is 109.04 GBP, 1 GBP = 1.6 USD",
  },
  total: "$4,500.00",
  warning: "UK VAT applies to this invoice, based on the country of the payer.",
};

const PaymentDetails: React.FunctionComponent<Props> = ({
  getInvoice,
  invoice,
  invoiceError,
  invoiceLoading,
  //
  updatePayer,
  payerError,
  payerLoading,
  //
  getPaymentMethods,
  payWithCard,
  paymentError,
  paymentLoading,
  paymentMethods,
}) => {
  const { invoiceId } = useParams();
  useEffect(() => {
    getInvoice(invoiceId);
    getPaymentMethods();
  }, []);

  const payByCard = useCallback(
    values => payWithCard({ invoiceId, ...values }),
    [invoiceId],
  );

  return (
    <Fragment>
      <PaymentHeader articleTitle={articleDetails.title}></PaymentHeader>

      <Root>
        {(function() {
          if (invoiceError) {
            return (
              <Flex flex={2}>
                <Text type="warning">{invoiceError}</Text>
              </Flex>
            );
          }

          if (invoiceLoading) {
            return (
              <Flex alignItems="center" vertical flex={2}>
                <Text mb={2}>Fetching invoice...</Text>
                <Loader size={6} />
              </Flex>
            );
          }

          return (
            <FormsContainer>
              <BillingInfo
                status={invoice.status}
                payer={invoice.payer}
                error={payerError}
                handleSubmit={updatePayer}
                loading={payerLoading}
              />
              <InvoicePayment
                payer={invoice.payer}
                methods={paymentMethods}
                error={paymentError}
                onSubmit={payByCard}
                loading={paymentLoading}
              />
            </FormsContainer>
          );
        })()}

        <Details
          articleDetailsExpanded={true}
          invoiceDetailsExpanded={true}
          articleDetails={articleDetails}
          invoiceDetails={invoiceDetails}
          charges={charges}
          mt={-44}
        />
      </Root>
    </Fragment>
  );
};

const mapStateToProps = (state: RootState) => ({
  invoice: invoiceSelectors.invoice(state),
  invoiceError: invoiceSelectors.invoiceError(state),
  invoiceLoading: invoiceSelectors.invoiceLoading(state),
  payerError: invoiceSelectors.payerError(state),
  payerLoading: invoiceSelectors.payerLoading(state),
  getMethodsError: paymentsSelectors.paymentMethodsError(state),
  getMethodsLoading: paymentsSelectors.paymentMethodsLoading(state),
  paymentMethods: paymentsSelectors.getPaymentMethods(state),
  paymentError: paymentsSelectors.recordPaymentError(state),
  paymentLoading: paymentsSelectors.recordPaymentLoading(state),
});

export default connect(
  mapStateToProps,
  {
    getInvoice: invoiceActions.getInvoice.request,
    updatePayer: invoiceActions.updatePayerAsync.request,
    payWithCard: paymentsActions.recordCardPayment.request,
    getPaymentMethods: paymentsActions.getPaymentMethods.request,
  },
)(PaymentDetails);

// #region styles
const Root = styled.div`
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
// #endregion
