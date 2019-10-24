import React, { useState, useEffect } from "react";
import { Route, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import JsonGraphqlServer from "json-graphql-server";

// * Antd components
import Row from "antd/es/row";
import Col from "antd/es/col";
import Card from "antd/es/card";

// * components
import { PaymentSteps } from "./components/payment-steps/payment-steps";
import { ManuscriptDetails } from "./components/manuscript-details/manuscript-details";
import { InvoiceDetails } from "./components/invoice-details/invoice-details";
import { Charges } from "./components/charges/charges";

import { appRedux, userRedux, manuscriptRedux, invoiceRedux } from "./state-management/redux";

import data from "./db";

const { appInitAction } = appRedux;
const { fetchUsersAction } = userRedux;
const { fetchManuscriptAction } = manuscriptRedux;
const { fetchInvoiceAction } = invoiceRedux;

// * pages
import { IndexContainer } from "./pages/index/index-container";
import { Payment } from "./pages/payment/payment";
import { BillingAddress } from "./pages/billing-address/billing-address";

// * app styles
import "./app.scss";

export const App = () => {
  const [current, setCurrent] = useState(0);
  const history = useHistory();
  const dispatch = useDispatch();
  const routes = ["/", "/billing-address", "/invoice-payment"];

  const onChange = current => {
    setCurrent(current);
    history.replace(routes[current]);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get("invoiceId");
    const startGraphqlServer = async () => {
      const server = JsonGraphqlServer({
        data,
        url: "http://localhost:4200/graphql",
      });
      await server.start();

      dispatch(fetchUsersAction());
      dispatch(fetchManuscriptAction());
      dispatch(fetchInvoiceAction(invoiceId));
    };

    startGraphqlServer();
    dispatch(appInitAction());
  }, []);

  return (
    <div className="app">
      <header className="flex">
        <a href="#" className="logo">
          <img src="/assets/images/hindawi.svg" alt="Hindawi Publishing Corporation"></img>
        </a>
        <h1>Payment Details</h1>
      </header>
      <main>
        <PaymentSteps current={current} onChange={onChange} />

        <Row>
          <Col span={12}>
            <Card>
              <Route path="/" exact render={() => <IndexContainer />} />
              <Route path="/billing-address" exact render={() => <BillingAddress />} />
              <Route path="/invoice-payment" exact render={() => <Payment />} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <ManuscriptDetails title="ARTICLE DETAILS" />
              <InvoiceDetails title="INVOICE DETAILS" />
              <Charges title="CHARGES" />
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
};

export default App;
