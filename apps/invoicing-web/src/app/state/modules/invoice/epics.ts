import { RootEpic, isActionOf, action } from "typesafe-actions";
import { of, from, interval } from "rxjs";
import {
  map,
  delay,
  filter,
  mergeMap,
  switchMap,
  catchError,
  withLatestFrom,
  tap,
  debounce,
} from "rxjs/operators";
import { modalActions } from "../../../providers/modal";

import { invoice } from "./selectors";
import { queries, mutations } from "./graphql";
import {
  getInvoice,
  getInvoices,
  updatePayerAsync,
  getInvoiceVat,
  applyCouponAction,
} from "./actions";

const fetchInvoiceEpic: RootEpic = (action$, state$, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(getInvoice.request)),
    delay(250),
    switchMap((action) =>
      graphqlAdapter.send(queries.getInvoice, { id: action.payload }),
    ),
    map((r) => {
      const invoice = r.data.invoice;
      const { article, ...invoiceItem } = invoice.invoiceItem;

      return getInvoice.success({
        ...invoice,
        invoiceItem,
        article,
      });
    }),
    catchError((err) => of(getInvoice.failure(err.message))),
  );
};

const updatePayerEpic: RootEpic = (action$, state$, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(updatePayerAsync.request)),
    switchMap((action) => {
      return graphqlAdapter.send(mutations.confirmInvoice, {
        payer: action.payload,
      });
    }),
    withLatestFrom(state$.pipe(map(invoice))),
    mergeMap(([r, invoice]) => {
      return from([
        modalActions.hideModal(),
        updatePayerAsync.success(r.data.updateInvoicePayer),
        getInvoice.request(invoice.invoiceId),
      ]);
    }),
    catchError((err) => {
      return of(updatePayerAsync.failure(err.message));
    }),
  );
};

const fetchInvoicesEpic: RootEpic = (action$, state$, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(getInvoices.request)),
    delay(250),
    switchMap((action) =>
      graphqlAdapter.send(queries.getInvoices, action.payload),
    ),
    map((r) => getInvoices.success(r.data.invoices)),
    catchError((err) => of(getInvoices.failure(err.message))),
  );
};

const getInvoiceVatEpic: RootEpic = (action$, _, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(getInvoiceVat.request)),
    delay(500),
    debounce(() => interval(300)),
    switchMap((action) => {
      return from(
        graphqlAdapter.send(queries.getInvoiceVat, action.payload),
      ).pipe(
        mergeMap((r) => from([getInvoiceVat.success(r.data.invoiceVat)])),
        catchError((err) => of(getInvoiceVat.failure(err.message))),
      );
    }),
  );
};

const applyCouponEpic: RootEpic = (action$, state$, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(applyCouponAction.request)),
    switchMap((action) => {
      return graphqlAdapter.send(mutations.applyCoupon, {
        invoiceId: action.payload.invoiceId,
        couponCode: action.payload.couponCode,
      });
    }),
    withLatestFrom(state$.pipe(map(invoice))),
    mergeMap(([r, invoice]) =>
      from([
        applyCouponAction.success(r.data.applyCoupon),
        getInvoice.request(invoice.invoiceId),
      ]),
    ),
    catchError((error) => of(applyCouponAction.failure(error.message))),
  );
};

export default [
  fetchInvoiceEpic,
  updatePayerEpic,
  fetchInvoicesEpic,
  getInvoiceVatEpic,
  applyCouponEpic,
];
