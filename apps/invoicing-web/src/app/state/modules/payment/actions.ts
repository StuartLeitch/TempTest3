import { createAsyncAction } from "typesafe-actions";

import {
  CreditCardInput,
  ClientTokenInput,
  ClientToken,
  PaymentMethod,
  PayPalPayment,
  Payment,
} from "./types";

export const getPaymentMethods = createAsyncAction(
  "payments/GET_PAYMENT_METHODS_REQUEST",
  "payments/GET_PAYMENT_METHODS_SUCCESS",
  "payments/GET_PAYMENT_METHODS_ERROR",
)<CreditCardInput, PaymentMethod[], string>();

export const getClientToken = createAsyncAction(
  "payments/GET_CLIENT_TOKEN_REQUEST",
  "payments/GET_CLIENT_TOKEN_SUCCESS",
  "payments/GET_CLIENT_TOKEN_ERROR",
)<ClientTokenInput, ClientToken, string>();

export const recordCardPayment = createAsyncAction(
  "payments/RECORD_CARD_REQUEST",
  "payments/RECORD_CARD_SUCCESS",
  "payments/RECORD_CARD_ERROR",
)<CreditCardInput, Payment, string>();

export const recordPayPalPayment = createAsyncAction(
  "payment/RECORD_PAY_PAL_REQUEST",
  "payment/RECORD_PAY_PAL_SUCCESS",
  "payment/RECORD_PAY_PAL_ERROR",
)<PayPalPayment, string, string>();
