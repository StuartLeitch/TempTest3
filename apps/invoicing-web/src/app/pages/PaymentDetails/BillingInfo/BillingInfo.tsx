import React, { Fragment } from "react";
import { Formik } from "formik";
import styled from "styled-components";
import {
  th,
  Flex,
  Label,
  Button,
  Expander,
  Textarea,
  FormField,
} from "@hindawi/react-components";

import ConfirmationModal from "./ConfirmationModal";
import IconRadioButton from "./IconRadioButton";
import { Modal, useModalActions } from "../../../providers/modal";
import { Payer, PayerInput } from "../../../state/modules/payer/types";

const PAYMENT_TYPES = {
  individual: "individual",
  institution: "institution",
};

const FormTextarea = field => (
  <Textarea height={26} {...field} resize="vertical" />
);

const imperativeValidation = (formFns, showModal) => () => {
  formFns.validateForm().then(errors => {
    const errorFields = Object.keys(errors);
    if (!errorFields.length) {
      showModal();
    } else {
      formFns.setTouched(
        errorFields.reduce((acc, el) => ({ ...acc, [el]: true }), {}),
      );
    }
  });
};

const validateFn = values => {
  const errors: any = {};

  if (!values.firstName) {
    errors.firstName = "Required";
  }
  if (!values.lastName) {
    errors.lastName = "Required";
  }
  if (!values.email) {
    errors.email = "Required";
  }
  if (!values.country) {
    errors.country = "Required";
  }
  if (!values.city) {
    errors.city = "Required";
  }
  if (!values.address) {
    errors.address = "Required";
  }

  if (values.paymentType === PAYMENT_TYPES.institution) {
    if (!values.institution) {
      errors.institution = "Required";
    }
    if (!values.vat) {
      errors.vat = "Required";
    }
  }

  return {};
};

interface Props {
  payer: Payer;
  error: string;
  loading: boolean;
  handleSubmit(payer: PayerInput): any;
}

const BillingInfo: React.FC<Props> = ({
  payer,
  error,
  loading,
  handleSubmit,
}) => {
  const { showModal, hideModal } = useModalActions();
  return (
    <Expander title="1. Payer details" flex={2} mb={6}>
      <Root>
        <Formik
          initialValues={payer}
          validate={validateFn}
          onSubmit={handleSubmit}
        >
          {({
            values,
            setTouched,
            handleSubmit,
            validateForm,
            setFieldValue,
          }) => {
            return (
              <Fragment>
                <Flex m={2} vertical>
                  <Label required>Who is making the payment?</Label>
                  <Flex mt={1} mb={4}>
                    <IconRadioButton
                      isSelected={
                        values.paymentType === PAYMENT_TYPES.individual
                      }
                      onClick={() =>
                        setFieldValue("paymentType", PAYMENT_TYPES.individual)
                      }
                      icon="user"
                      label="Pay as Individual"
                      mr={1}
                    />
                    <IconRadioButton
                      isSelected={
                        values.paymentType === PAYMENT_TYPES.institution
                      }
                      onClick={() =>
                        setFieldValue("paymentType", PAYMENT_TYPES.institution)
                      }
                      icon="institution"
                      label="Pay as Institution"
                      ml={1}
                    />
                  </Flex>

                  {values.paymentType === PAYMENT_TYPES.institution && (
                    <Flex>
                      <FormField
                        mr={4}
                        flex={2}
                        required
                        label="Institution name"
                        name="institution"
                      />
                      <FormField
                        required
                        label="EC VAT Reg. No"
                        name="vat"
                        flex={1}
                      />
                    </Flex>
                  )}

                  {values.paymentType !== null && (
                    <Fragment>
                      <Flex>
                        <Flex flex={2} mr={4}>
                          <FormField
                            mr={4}
                            required
                            name="firstName"
                            label="First Name"
                          />
                          <FormField
                            required
                            label="Last Name"
                            name="lastName"
                          />
                        </Flex>
                        <FormField
                          required
                          label="Email"
                          name="email"
                          flex={1}
                        />
                      </Flex>

                      <Flex
                        alignItems="flex-start"
                        justifyContent="space-between"
                      >
                        <FormField
                          flex={2}
                          required
                          name="address"
                          label="Address"
                          component={FormTextarea}
                        />
                        <Flex vertical flex={1} ml={4}>
                          <FormField required label="Country" name="country" />
                          <FormField required label="City" name="city" />
                        </Flex>
                      </Flex>

                      <Button
                        onClick={imperativeValidation(
                          {
                            setTouched,
                            validateForm,
                          },
                          showModal,
                        )}
                        size="medium"
                        alignSelf="flex-end"
                      >
                        Create invoice
                      </Button>
                    </Fragment>
                  )}
                </Flex>
                <Modal>
                  <ConfirmationModal
                    error={error}
                    loading={loading}
                    onCancel={hideModal}
                    onAccept={handleSubmit}
                  />
                </Modal>
              </Fragment>
            );
          }}
        </Formik>
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
