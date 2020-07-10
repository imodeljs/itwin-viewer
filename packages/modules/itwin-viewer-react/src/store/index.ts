/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { applyMiddleware, compose, createStore, Store } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";

import logger from "./middlewares/logger";
import rootReducer from "./rootReducer";

const configureStore = (): Store => {
  if (process.env.NODE_ENV === "production") {
    return createStore(rootReducer, undefined, compose());
  }
  return createStore(
    rootReducer,
    undefined,
    composeWithDevTools(applyMiddleware(logger))
  );
};

const store = configureStore();

export default store;
