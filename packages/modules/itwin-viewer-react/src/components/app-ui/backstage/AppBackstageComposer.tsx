/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { UserInfo } from "@bentley/itwin-client";
import {
  BackstageComposer,
  FrameworkState,
  UserProfileBackstageItem,
} from "@bentley/ui-framework";
import * as React from "react";
import { connect } from "react-redux";

import { AppState } from "../../../store/rootReducer";
import { AppBackstageItemProvider } from "./AppBackstageItemProvider";

function mapStateToProps(state: AppState) {
  const frameworkState = state.iModelCore as FrameworkState;

  if (!frameworkState) {
    return undefined;
  }

  return { userInfo: frameworkState.sessionState.userInfo };
}

interface AppBackstageComposerProps {
  /** UserInfo from sign-in */
  userInfo: UserInfo | undefined;
}

export class AppBackstageComposerComponent extends React.PureComponent<
  AppBackstageComposerProps
> {
  private _itemsProvider = new AppBackstageItemProvider();
  public render() {
    return (
      <BackstageComposer
        header={
          this.props.userInfo && (
            <UserProfileBackstageItem userInfo={this.props.userInfo} />
          )
        }
        items={[...this._itemsProvider.backstageItems]}
      />
    );
  }
}

export const AppBackstageComposer = connect(mapStateToProps)(
  AppBackstageComposerComponent
);
