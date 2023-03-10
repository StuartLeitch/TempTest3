import React, { Fragment } from "react";
import { useParams } from "react-router-dom";
import { set, isEmpty } from "lodash";
import { Formik } from "formik";
import {
  Flex,
  Label,
  Button,
  Textarea,
  FormField,
} from "@hindawi/react-components";

import { Modal, useModalActions } from "../../../providers/modal";
import { PAYMENT_TYPES, COUNTRY_CODES } from "./types";
import CountryField from "./CountryField";
import StateField from "./StateField";
import IconRadioButton from "./IconRadioButton";
import ConfirmationModal from "./ConfirmationModal";
import VatChargesObserver from "./VATChargesObserver";

interface Props {
  payer: any;
  error: string;
  loading: boolean;
  couponError: string;
  handleSubmit(payer: any): any;
  onVatFieldChange(
    country: string,
    state: string,
    postalCode: string,
    paymentType: string,
  ): any;
  applyCoupon(invoiceId: string, couponCode: string): any;
  refreshInvoice(invoiceId: string): any;
}

const FormTextarea = (field: any) => (
  <Textarea
    height={26}
    {...field}
    resize="vertical"
    style={{ resize: "none" }}
  />
);

const parseErrors = (errors, prefix = "") => {
  return Object.entries(errors).reduce((acc, [key, value]) => {
    if (typeof value === "object") {
      return { ...acc, ...parseErrors(value, `${prefix}${key}.`) };
    } else {
      return {
        ...acc,
        [`${prefix}${key}`]: true,
      };
    }
  }, {});
};

const imperativeValidation = (formFns, showModal) => () => {
  formFns.validateForm().then((errors) => {
    const errorFields = parseErrors(errors);
    if (isEmpty(errorFields)) {
      showModal();
    } else {
      formFns.setTouched(errorFields);
    }
  });
};

const emailRegex = new RegExp(
  /^(([^<>()\[\]\\.,;:\s@"“”]+(\.[^<>()\[\]\\.,;:\s@"“”]+)*))@(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})$/i,
);

const validateFn = (values: any) => {
  const errors: any = {};

  if (values.name) {
    if (!values.name.trim()) {
      errors.name = "Blank value is forbidden.";
    }

    if (/^[!@#$%^&*()+=_\[\]{};:\\|,.<>\/?]*$/.test(values.name)) {
      errors.name = "Special characters only are not permitted";
    }
  } else {
    errors.name = "Required";
  }

  if (!emailRegex.test(values.email)) {
    errors.email = "Invalid email address";
  }

  if (!values.email) {
    errors.email = "Required";
  }

  if (!values.address.country) {
    set(errors, "address.country", "Required");
  }

  if (values.address.country) {
    if (!values.address.country.trim()) {
      set(errors, "address.country", "Blank value is forbidden.");
    }

    if (values.address.country === COUNTRY_CODES.US) {
      if (values.address.state) {
        if (!values.address.state.trim()) {
          set(errors, "address.state", "Blank value is forbidden.");
        }
      } else {
        set(errors, "address.state", "Required");
      }

      if (values.address.postalCode) {
        if (!values.address.postalCode.trim()) {
          set(errors, "address.postalCode", "Blank value is forbidden.");
        }
      } else {
        set(errors, "address.postalCode", "Required");
      }

      if (!/^\d{5}$/.test(values.address.postalCode)) {
        set(
          errors,
          "address.postalCode",
          "Invalid postal code format, use 5 numbers",
        );
      }
    }
  } else {
    set(errors, "address.country", "Required");
  }

  if (values.address.city) {
    if (!values.address.city.trim()) {
      set(errors, "address.city", "Blank value is forbidden.");
    }
  } else {
    set(errors, "address.city", "Required");
  }

  if (values.address.addressLine1) {
    if (!values.address.addressLine1.trim()) {
      set(errors, "address.addressLine1", "Blank value is forbidden.");
    }
  } else {
    set(errors, "address.addressLine1", "Required");
  }

  if (values.type === PAYMENT_TYPES.institution) {
    if (values.organization) {
      if (!values.organization.trim()) {
        errors.organization = "Blank value is forbidden.";
      }

      if (/^[!@#$%^&*()+=_\[\]{};:\\|,.<>\/?]*$/.test(values.organization)) {
        errors.organization = "Special characters only are not permitted";
      }
    } else {
      errors.organization = "Required";
    }
  }

  return errors;
};

const InvoiceForm: React.FunctionComponent<Props> = ({
  payer,
  error,
  couponError,
  loading,
  handleSubmit,
  onVatFieldChange,
  applyCoupon,
  refreshInvoice,
}: any) => {
  const { invoiceId } = useParams() as any;
  const { showModal, hideModal } = useModalActions();

  if (!payer) {
    payer = {
      invoiceId,
      type: null,
      address: {
        country: "",
        state: "",
        city: "",
      },
      coupon: "",
    };
  }

  return (
    <Formik
      initialValues={payer}
      validate={validateFn}
      onSubmit={({ coupon, ...payer }) => handleSubmit({ invoiceId, ...payer })}
    >
      {({
        values,
        setTouched,
        handleSubmit,
        validateForm,
        setFieldValue,
        errors,
      }) => {
        return (
          <Fragment>
            <VatChargesObserver
              postalCode={values.address.postalCode}
              country={values.address.country}
              state={values.address.state}
              paymentType={values.type}
              onChange={onVatFieldChange}
            />
            <Flex m={2} vertical>
              <Label required>Who is making the payment?</Label>
              <Flex mt={1} mb={4}>
                <IconRadioButton
                  isSelected={
                    values &&
                    values.type &&
                    values.type === PAYMENT_TYPES.individual
                  }
                  onClick={() =>
                    setFieldValue("type", PAYMENT_TYPES.individual)
                  }
                  icon="user"
                  label="Pay as Individual"
                  mr={1}
                />
                <IconRadioButton
                  isSelected={
                    values &&
                    values.type &&
                    values.type === PAYMENT_TYPES.institution
                  }
                  onClick={() =>
                    setFieldValue("type", PAYMENT_TYPES.institution)
                  }
                  icon="institution"
                  label="Pay as Institution"
                  ml={1}
                />
              </Flex>

              {values &&
                values.type &&
                values.type === PAYMENT_TYPES.institution && (
                  <Flex>
                    <FormField
                      mr={4}
                      flex={2}
                      required
                      label="Institution name"
                      name="organization"
                    />
                    <FormField label="EC VAT Reg. No" name="vatId" flex={1} />
                  </Flex>
                )}

              {values && values.type !== null && (
                <Fragment>
                  <Flex>
                    <FormField
                      mr={4}
                      flex={2}
                      required
                      name="name"
                      label="Name"
                    />

                    <FormField required label="Email" name="email" flex={1} />
                  </Flex>

                  <Flex alignItems="flex-start" justifyContent="space-between">
                    <Flex vertical flex={2}>
                      <FormField
                        flex={2}
                        required
                        name="address.addressLine1"
                        label="Address"
                        component={FormTextarea}
                      />
                      {values.address.country === COUNTRY_CODES.US && (
                        <FormField
                          required
                          label="State"
                          name="address.state"
                          component={StateField}
                        />
                      )}
                    </Flex>
                    <Flex vertical flex={1} ml={4}>
                      <FormField
                        required
                        label="Country"
                        name="address.country"
                        component={CountryField}
                      />
                      {values.address.country === COUNTRY_CODES.US && (
                        <FormField
                          flex={1}
                          required
                          name="address.postalCode"
                          label="Postal code"
                        />
                      )}
                      <FormField required label="City" name="address.city" />
                    </Flex>
                  </Flex>

                  <Flex justifyContent="space-between">
                    <Flex>
                      <FormField
                        error={couponError}
                        placeholder="Insert coupon code here"
                        label="Coupon"
                        name="coupon"
                      />
                      <Button
                        type="secondary"
                        disabled={!values.coupon}
                        size="medium"
                        mb="1"
                        ml="2"
                        onClick={() => applyCoupon(invoiceId, values.coupon)}
                      >
                        Apply
                      </Button>
                    </Flex>
                    <Flex justifyContent="flex-end">
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
                        Confirm Invoice
                      </Button>
                    </Flex>
                  </Flex>
                </Fragment>
              )}
            </Flex>
            <Modal>
              <ConfirmationModal
                error={error}
                loading={loading}
                onCancel={hideModal}
                onAccept={handleSubmit}
                onRefresh={refreshInvoice}
              />
            </Modal>
          </Fragment>
        );
      }}
    </Formik>
  );
};

export default InvoiceForm;
