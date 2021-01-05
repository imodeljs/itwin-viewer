/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { UserManager, WebStorageStateStore } from "oidc-client";

import { AuthType, AuthTypeKey, RedirectKey } from "./";

export class OidcClient {
  private _userManager: UserManager;
  public loggedIn: boolean;

  constructor() {
    const userSettings = {
      scope: process.env.IMJS_OIDC_CLIENT_SCOPES,
      client_id: process.env.IMJS_OIDC_CLIENT_CLIENT_ID,
      redirect_uri: process.env.IMJS_OIDC_CLIENT_REDIRECT_URI,
      post_logout_redirect_uri: process.env.IMJS_OIDC_CLIENT_LOGOUT_URI,
      authority: process.env.IMJS_OIDC_CLIENT_AUTHORITY,
      response_type: process.env.IMJS_OIDC_CLIENT_RESPONSE_TYPE,
      userStore: new WebStorageStateStore({ store: localStorage }),
      automaticSilentRenew: true,
      accessTokenExpiringNotificationTime: 600,
    };
    this._userManager = new UserManager(userSettings);
    this.loggedIn = false;

    this._userManager.events.addUserLoaded(() => {
      this.loggedIn = true;
    });
    this._userManager.events.addUserUnloaded(() => {
      this.loggedIn = false;
    });
    this._userManager.events.addAccessTokenExpired(() => {
      this.loggedIn = false;
    });
    this._userManager.events.addUserSignedOut(() => {
      this.loggedIn = false;
    });
    this._userManager.events.addSilentRenewError((error) => {
      console.error(error);
      this.loggedIn = false;
    });
  }

  public getUserManager = (): UserManager => {
    return this._userManager;
  };

  public signIn = async (redirectPath?: string): Promise<void> => {
    this._userManager.clearStaleState().catch((error) => console.error(error));
    sessionStorage.setItem(AuthTypeKey, AuthType.OIDC);
    if (redirectPath) {
      sessionStorage.setItem(RedirectKey, redirectPath);
    }
    await this._userManager.signinRedirect();
  };

  public signOut = async (redirectPath?: string): Promise<void> => {
    if (redirectPath) {
      sessionStorage.setItem(RedirectKey, redirectPath);
    }
    await this._userManager.signoutRedirect();
  };
}
