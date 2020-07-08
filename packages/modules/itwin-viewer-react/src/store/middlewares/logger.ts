/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { AnyAction, MiddlewareAPI } from "redux";

const logger = (store: MiddlewareAPI) => (next: Function) => (
  action: AnyAction
) => {
  if (console && process.env.NODE_ENV !== "production") {
    console.group(action.type);
    console.info("dispatching", action);
  }
  const result = next(action);
  if (console && process.env.NODE_ENV !== "production") {
    console.log("next state", store.getState());
    console.groupEnd();
  }
  return result;
};

export default logger;
