import { combineReducers } from "redux";

import invoice from "../modules/invoice";
import payments from "../modules/payments";

import { modalReducer } from "../../providers/modal";

const rootReducer = combineReducers({
  modal: modalReducer,
  invoice,
  payments,
});

export default rootReducer;
