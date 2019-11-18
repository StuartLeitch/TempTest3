import React, { useMemo } from "react";
import { Formik } from "formik";
import styled from "styled-components";
import {
  Expander,
  Label,
  ActionLink,
  Icon,
  th,
} from "@hindawi/react-components";

import Paypal from "./Paypal";
import BankTransfer from "./BankTransfer";
import ChoosePayment from "./ChoosePayment";
import CreditCardForm from "./CreditCardForm";

const PAYMENT_METHODS = {
  paypal: "paypal",
  creditCard: "creditCard",
  bankTransfer: "bankTransfer",
};

interface Props {
  payer: any;
  error: string;
  onSubmit: any;
  loading: boolean;
  methods: Record<string, string>;
}

const validateFn = methods => values => {
  if (methods[values.paymentMethodId] === "Paypal") return {};

  const errors: any = {};

  if (!values.cardNumber) {
    errors.cardNumber = "Required";
  }
  if (!values.expiration) {
    errors.expiration = "Required";
  }
  if (!values.cvv) {
    errors.cvv = "Required";
  }

  return errors;
};

const addInvoiceDownloadLink = payer => {
  if (payer) {
    return (
      <ActionLink type="action" ml="4" link={`./api/invoice/${payer.id}`}>
        <Icon name="download" color="colors.actionSecondary" mr="1" />
        Download
      </ActionLink>
    );
  }
};

const InvoicePayment: React.FunctionComponent<Props> = ({
  payer,
  methods,
  loading,
  onSubmit,
}) => {
  const parsedMethods = useMemo(
    () =>
      Object.entries(methods).map(([id, name]) => ({
        id,
        name,
        isActive: true,
      })),
    [methods],
  );
  return (
    <Expander title="2. Invoice & Payment">
      <Label my="4" ml="4">
        Your Invoice
        {addInvoiceDownloadLink(payer)}
      </Label>
      <Formik
        validate={validateFn(methods)}
        initialValues={{ paymentMethodId: null }}
        onSubmit={onSubmit}
      >
        {({ handleSubmit, setFieldValue, values }) => {
          return (
            <Root>
              <ChoosePayment
                methods={parsedMethods}
                setFieldValue={setFieldValue}
                values={values}
              />
              {methods[values.paymentMethodId] === "Credit Card" && (
                <CreditCardForm handleSubmit={handleSubmit} loading={loading} />
              )}
              {methods[values.paymentMethodId] === "Bank Transfer" && (
                <BankTransfer />
              )}
              {methods[values.paymentMethodId] === "Paypal" && (
                <Paypal onSuccess={p => console.log("pe success", p)} />
              )}
            </Root>
          );
        }}
      </Formik>
    </Expander>
  );
};

export default InvoicePayment;

// #region styles
const Root = styled.div`
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  padding: calc(${th("gridUnit")} * 4);
  width: 100%;
`;
// #endregion
