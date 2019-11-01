export default {
  CREATE_PAYMENT: "@prefix/payer/CREATE_PAYMENT",
  CREATE_PAYMENT_FULFILLED: "@prefix/payer/CREATE_PAYMENT_FULFILLED",

  // * payer info constants
  CREATE_PAYER: "@prefix/payer/CREATE_PAYER",
  UPDATE_PAYER: "@prefix/payer/UPDATE_PAYER",
  // * billing address constants
  UPDATE_ADDRESS: "@prefix/payer/UPDATE_ADDRESS",
  // * credit card constants
  UPDATE_CARD: "@prefix/payer/UPDATE_CARD",
  // * paypal constants
  CREATE_PAYPAL_PAYMENT: "@prefix/payer/CREATE_PAYPAL_PAYMENT",
  CREATE_PAYPAL_PAYMENT_FULFILLED: "@prefix/payer/CREATE_PAYPAL_PAYMENT_FULFILLED",
} as const;
