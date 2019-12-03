import React from "react";
import styled from "styled-components";
import { th, Expander } from "@hindawi/react-components";

import InvoiceForm from "./InvoiceForm";
import InvoiceInfo from "./InvoiceInfo";

interface Props {
  payer: any;
  error: string;
  loading: boolean;
  status: "DRAFT" | "ACTIVE" | "FINAL";
  handleSubmit(payer: any): any;
  onVatFieldChange(country: string, paymentType: string): any;
}

const BillingInfo: React.FC<Props> = ({
  payer,
  error,
  status,
  loading,
  handleSubmit,
  onVatFieldChange
}) => {
  return (
    <Expander mb={6} flex={2} expanded={true} title="1. Payer details">
      <Root>
        {status === "ACTIVE" || status === "FINAL" ? (
          <InvoiceInfo {...payer} />
        ) : (
          <InvoiceForm
            payer={payer}
            error={error}
            loading={loading}
            handleSubmit={handleSubmit}
            onVatFieldChange={onVatFieldChange}
          />
        )}
      </Root>
    </Expander>
  );
};

export default BillingInfo;

// #region styles
const Root = styled.div`
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  padding: calc(${th("gridUnit")} * 4);
  width: 100%;
`;
// #endregion
