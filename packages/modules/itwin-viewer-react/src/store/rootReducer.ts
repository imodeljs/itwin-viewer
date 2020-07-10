/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { FrameworkReducer } from "@bentley/ui-framework";
import { combineReducers } from "redux";

const rootReducer = combineReducers({
  iModelCore: FrameworkReducer as any,
});

export type AppState = ReturnType<typeof rootReducer>;

export default rootReducer;
