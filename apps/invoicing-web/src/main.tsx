import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import JsonGraphqlServer from "json-graphql-server";

import { configureStore } from "./app/frameworks/redux";
import App from "./app/app";
import data from "./app/db";

const server = JsonGraphqlServer({
  data,
  url: "http://localhost:4200/graphql",
});
server.start();

const store: any = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById("root"),
);
