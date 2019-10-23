import React, { useState, useEffect } from "react";
import { Route, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import JsonGraphqlServer from "json-graphql-server";

const axios = require("axios").default;

// * Antd components
import Row from "antd/es/row";
import Col from "antd/es/col";
import Card from "antd/es/card";
import List from "antd/es/list";
import Typography from "antd/es/typography";
// import Avatar from "antd/es/avatar";
// import Tabs from "antd/es/tabs";
// import Icon from "antd/es/icon";

// * components
// import { Panel } from "./components/panel/panel";
import { PaymentSteps } from "./components/payment-steps/payment-steps";
// import CreditCardForm from "./components/credit-card-payment-form/credit-card-payment-form";

import { appRedux } from "./state-management/redux";

import data from "./db";

const { appInitAction } = appRedux;

// * pages
import { Index } from "./pages/index/index";
import { Payment } from "./pages/payment/payment";
import { BillingAddress } from "./pages/billing-address/billing-address";

const { Text } = Typography;
// const { TabPane } = Tabs;

// * app styles
import "./app.scss";

const articleDetails = [
  ["Journal Title", "Advances in Condensed Matter Physics"],
  ["Article Title", "RNA detection based on graphene field effect transistor biosensor"],
  ["Article ID", "8146765"],
  ["Article Type", "Research Article"],
  ["CC License", "CC-BY 4.0"],
  ["Corresponding Author", "Shicai Xu"],
  ["Additional Authors", "view author list"],
];

const invoiceDetails = [
  ["Invoice Issue Date", "19 September 2019"],
  ["Date of Supply", "19 September 2019"],
  ["Reference Number", "483/2019"],
  ["Terms", "Payable upon Receipt"],
];

const charges = [
  ["Article Processing Charges", 1250.0],
  ["Net Charges", 1250.0],
  ["VAT (+20%)", 250.0],
  ["Total", 1500.0],
];

// const handleAppInit = () => {
//   console.log("App INIT called!!");
// };

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
    const loadGraphqlServer = async () => {
      const server = JsonGraphqlServer({
        data,
        url: "http://localhost:4200/graphql",
      });
      server.start();

      const { data: response } = await axios({
        url: "http://localhost:4200/graphql",
        method: "POST",
        data: JSON.stringify({ query: "query allPosts { allPosts { id } }" }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      return response;
    };

    loadGraphqlServer();
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
              <Route path="/" exact render={() => <Index />} />
              <Route path="/billing-address" exact render={() => <BillingAddress />} />
              <Route path="/invoice-payment" exact render={() => <Payment />} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Card type="inner" title="ARTICLE DETAILS">
                <List
                  dataSource={articleDetails}
                  renderItem={item => (
                    <List.Item>
                      <Text strong>{item[0]}</Text> {item[1]}
                    </List.Item>
                  )}
                />
              </Card>
              <Card type="inner" title="INVOICE DETAILS">
                <List
                  dataSource={invoiceDetails}
                  renderItem={item => (
                    <List.Item>
                      <Text strong>{item[0]}</Text> {item[1]}
                    </List.Item>
                  )}
                />
              </Card>
              <Card type="inner" title="CHARGES">
                <List
                  dataSource={charges}
                  renderItem={item => (
                    <List.Item>
                      <Text strong>{item[0]}</Text> <Text strong>$</Text>
                      {item[1]}
                    </List.Item>
                  )}
                />
              </Card>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
};

export default App;
