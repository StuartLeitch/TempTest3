import { RootEpic, isActionOf, action } from "typesafe-actions";
import { of, from } from "rxjs";
import {
  map,
  delay,
  filter,
  mergeMap,
  switchMap,
  catchError,
  withLatestFrom
} from "rxjs/operators";
import { modalActions } from "../../../providers/modal";

import { invoice } from "./selectors";
import { queries, mutations } from "./graphql";
import { getInvoice, getInvoices, updatePayerAsync, getInvoiceVat } from "./actions";

const fetchInvoiceEpic: RootEpic = (action$, state$, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(getInvoice.request)),
    delay(1000),
    switchMap(action =>
      graphqlAdapter.send(queries.getInvoice, { id: action.payload }),
    ),
    map(r => {
      const invoice = r.data.invoice;
      const { article, ...invoiceItem } = invoice.invoiceItem;

      return getInvoice.success({
        ...invoice,
        invoiceItem,
        article,
      });
    }),
    catchError(err => of(getInvoice.failure(err.message))),
  );
};

const updatePayerEpic: RootEpic = (action$, state$, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(updatePayerAsync.request)),
    switchMap(action => {
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
    catchError(err => {
      return of(updatePayerAsync.failure(err.message));
    }),
  );
};

const fetchInvoicesEpic: RootEpic = (action$, state$, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(getInvoices.request)),
    delay(500),
    switchMap(action => graphqlAdapter.send(queries.getInvoices)),
    map(r => {
      return getInvoices.success(r.data.invoices);
    }),
    catchError(err => of(getInvoices.failure(err.message))),
  );
};

const getInvoiceVatEpic: RootEpic =(action$, _, { graphqlAdapter }) => {
  return action$.pipe(
    filter(isActionOf(getInvoiceVat.request)),
    delay(500),
    switchMap(action => graphqlAdapter.send(queries.getInvoiceVat, {...action.payload})),
    map(r => getInvoiceVat.success(r.data.invoiceVat)),
    catchError(err => of(getInvoiceVat.failure(err.message))),
  )
}

export default [fetchInvoiceEpic, updatePayerEpic, fetchInvoicesEpic, getInvoiceVatEpic];
